import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
	flattenObject,
	generateULID,
	InternalServerErrorException,
	ItemResponseDto,
	ListResponseDto,
	MessengerService,
	NotFoundException,
	ProjectsService,
	VercelSandbox,
	VercelService,
} from '@aquacode/common';
import { FileDocument, FilesService } from '@aquacode/modules/files';
import { Model } from 'mongoose';
import ms from 'ms';
import { posix as pathPosix } from 'path';
import { SandboxesFilteringParameterDto } from './dtos';
import { SandboxStatus } from './enums';
import { SandboxErrors } from './errors';
import { Sandbox, SandboxDocument } from './schemas';

const AQUA_CODE_TEMPLATE =
	'https://storage.aquacode.ai/bali/templates/nextjs_react_heroui_ts_alpha.tar.gz';

@Injectable()
export class SandboxesService {
	private readonly logger: Logger = new Logger(SandboxesService.name);
	private readonly sandboxPrefix: string = 'sbx';
	private readonly aquaDomain: string;

	// Active sandboxes
	private readonly activeSandboxes = new Map<string, { sandbox: Sandbox }>();
	private readonly installingSandboxDependencies = new Set<string>();

	// Sandbox lifecycle
	private readonly sandboxInactivityTimeout: number = 3 * 60 * 1000; // 3 minutes
	private readonly sandboxMaxTime: number = 45 * 60 * 1000; // 45 minutes
	private readonly sandboxInactivityTimers = new Map<string, NodeJS.Timeout>();
	private readonly sandboxMaxTimeTimers = new Map<string, NodeJS.Timeout>();

	constructor(
		@InjectModel(Sandbox.name)
		private readonly sandboxModel: Model<SandboxDocument>,
		private readonly configService: ConfigService,
		private readonly projectsService: ProjectsService,
		private readonly messengerService: MessengerService,
		@Inject(forwardRef(() => FilesService))
		private readonly filesService: FilesService,
		private readonly httpService: HttpService,
		private readonly vercelService: VercelService,
	) {
		this.aquaDomain = this.configService.get<string>('AQUA_DOMAIN')!;
	}

	async getSandboxes(
		filter: SandboxesFilteringParameterDto,
	): Promise<ListResponseDto<SandboxDocument>> {
		const { page, perPage, projectId, status } = filter;

		let query = this.sandboxModel.find({
			projectId,
			...(status && { status }),
		});
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage).sort({ createdAt: -1 });
		}

		const result = await query;
		const totalCount = await this.sandboxModel.countDocuments({
			projectId,
			...(status && { status }),
		});

		return {
			result,
			resultInfo: {
				page: page || 1,
				perPage: perPage || totalCount,
				totalCount,
			},
			success: true,
			messages: [],
			errors: [],
		};
	}

	async createSandbox(
		docContent: Pick<Sandbox, 'projectId'>,
	): Promise<ItemResponseDto<SandboxDocument>> {
		const sandboxId = generateULID(this.sandboxPrefix);
		const sandbox = await this.sandboxModel.create({
			_id: sandboxId,
			projectId: docContent.projectId,
			status: SandboxStatus.INITIALIZING,
		});
		return {
			result: sandbox,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async findSandboxRequestedInTheLast45MinutesByProjectID(
		projectId: string,
	): Promise<SandboxDocument | null> {
		// Find a sandbox created in the last 45 minutes
		return this.sandboxModel.findOne({
			projectId,
			status: { $in: [SandboxStatus.INITIALIZING, SandboxStatus.INITIALIZED] },
			requestedAt: { $gt: new Date(Date.now() - this.sandboxMaxTime) },
		});
	}

	async updateSandboxById(
		sandboxId: string,
		doc: Partial<Omit<Sandbox, '_id' | 'projectId'>>,
	): Promise<ItemResponseDto<SandboxDocument>> {
		const flattenedDoc = flattenObject(doc as Record<string, any>);
		const sandbox = await this.sandboxModel.findOneAndUpdate(
			{ _id: sandboxId },
			{ $set: flattenedDoc },
			{ new: true },
		);
		if (!sandbox) {
			throw new NotFoundException({ errors: SandboxErrors.SANDBOX_NOT_FOUND });
		}
		return {
			result: sandbox,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async updateSandboxActivityByProjectId(projectId: string): Promise<void> {
		const sandboxEntry = this.activeSandboxes.get(projectId);
		if (!sandboxEntry) {
			return;
		}

		// Update lastActivityAt
		await this.sandboxModel.updateOne(
			{ _id: sandboxEntry.sandbox._id },
			{ $set: { lastActivityAt: new Date() } },
		);

		// Reset inactivity timer
		const existingTimer = this.sandboxInactivityTimers.get(projectId);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Set a new inactivity timer
		const inactivityTimer = setTimeout(async () => {
			await this.closeVercelSandboxByProjectId(projectId);
		}, this.sandboxInactivityTimeout);

		this.sandboxInactivityTimers.set(projectId, inactivityTimer);

		this.logger.debug(`🔄 Updated sandbox activity for project ${projectId}`);
	}

	async createVercelSandboxByProjectId(projectId: string): Promise<VercelSandbox> {
		const lastSandbox = await this.findSandboxRequestedInTheLast45MinutesByProjectID(projectId);
		if (lastSandbox) {
			throw new NotFoundException({ errors: SandboxErrors.SANDBOX_NOT_FOUND_IN_TIME_WINDOW });
		}

		const { result: project } = await this.projectsService.getProjectById(projectId);
		const vercelProjectId = project.projectMetaData.vercel.projectId;

		// Create an initial sandbox
		const { result: sandbox } = await this.createSandbox({ projectId });

		// Broadcast sandbox process started event via PubSub
		this.messengerService.publish({
			eventName: 'sandbox.initializing',
			eventData: sandbox,
		});

		const { result: files } = await this.filesService.getFiles({
			projectId,
			page: 1,
			perPage: 1000,
		});

		const isNewProject: boolean = files.length === 0;

		if (isNewProject) {
			// Initialize a project in the sandbox
			await this.filesService.createDefaultFilesByProjectId(projectId);

			try {
				const now = new Date();
				const vercelSandbox = await this.vercelService.createSandbox({
					vercelProjectId,
					templateUrl: AQUA_CODE_TEMPLATE,
					ports: [3000],
					runtime: 'node22',
					timeout: ms(`${this.sandboxMaxTime}Milliseconds`),
					vcpus: 2, // Default to 2 vCPUs
				});

				// Add health check for sandbox URL
				const vercelSandboxDomain = vercelSandbox.domain(3000);

				await vercelSandbox.runCommand({
					cmd: 'npm',
					args: ['install'],
				});

				// Create a .env.development file with AquaCode environment variables
				await vercelSandbox.writeFiles([
					{
						path: '.env',
						content: Buffer.from(
							`NEXT_PUBLIC_AQUA_DOMAIN=${this.aquaDomain}
                             NEXT_PUBLIC_AQUA_PROJECT_ID=${projectId}
                          `,
							'utf8',
						),
					},
				]);

				await vercelSandbox.runCommand({
					cmd: 'npm',
					args: ['run', 'dev'],
					detached: true,
				});

				let attempts = 0;
				const maxAttempts = 10;
				let isAccessible = false;

				while (attempts < maxAttempts && !isAccessible) {
					try {
						await new Promise((resolve) => setTimeout(resolve, 3000));
						await this.httpService.axiosRef.get(vercelSandboxDomain);
						isAccessible = true;
					} catch (error) {
						attempts++;
						this.logger.warn(
							`⏳ Sandbox URL ${vercelSandboxDomain} not accessible yet (attempt ${attempts}/${maxAttempts}): ${error instanceof Error ? error.message : String(error)}`,
						);
						if (attempts === maxAttempts) {
							this.logger.error(
								`❌ Sandbox failed to become accessible after ${maxAttempts} attempts`,
							);
						}
					}
				}

				await this.updateSandboxById(sandbox._id, {
					domain: vercelSandboxDomain,
					status: SandboxStatus.INITIALIZED,
					requestedAt: now,
					sandboxMetaData: {
						vercel: {
							sandboxId: vercelSandbox.sandboxId,
							vcpus: 2,
							memory: 4096,
							region: 'iad1',
							runtime: 'node22',
							timeout: ms(`${this.sandboxInactivityTimeout}Milliseconds`),
							cwd: '/vercel/sandbox',
							requestedAt: now,
							createdAt: now,
							updatedAt: now,
						},
					},
					createdAt: now,
					updatedAt: now,
				});

				// Broadcast sandbox process completed event via PubSub
				this.messengerService.publish({
					eventName: 'sandbox.initialized',
					eventData: sandbox,
				});

				// Track the sandbox as active and set up lifecycle management
				this.initializeSandboxLifecycleByProjectId(projectId, sandbox);

				return vercelSandbox;
			} catch (error: unknown) {
				await sandbox.updateOne({ $set: { status: SandboxStatus.FAILED } });

				// Broadcast sandbox process failed event via PubSub
				this.messengerService.publish({
					eventName: 'sandbox.failed',
					eventData: sandbox,
				});

				this.logger.error('Failed to create sandbox', error);
				throw new InternalServerErrorException({
					errors: SandboxErrors.SANDBOX_CREATION_FAILED,
				});
			}
		} else {
			try {
				const now = new Date();

				// First, create a sandbox with base node_modules
				const vercelSandbox = await this.vercelService.createSandbox({
					vercelProjectId,
					templateUrl: AQUA_CODE_TEMPLATE,
					ports: [3000],
					runtime: 'node22',
					timeout: ms(`${this.sandboxMaxTime}Milliseconds`),
					vcpus: 2, // Default to 2 vCPUs
				});

				// Prepare files for compression
				const entries = files.map((file: FileDocument) => ({
					path: file.name,
					content: Buffer.from(file.content, 'utf8'),
				}));

				const BATCH_SIZE = 200;
				for (let i = 0; i < entries.length; i += BATCH_SIZE) {
					const batch = entries.slice(i, i + BATCH_SIZE);
					await vercelSandbox.writeFiles(batch);
				}

				await vercelSandbox.writeFiles([
					{
						path: '.env',
						content: Buffer.from(
							`NEXT_PUBLIC_AQUA_DOMAIN=${this.aquaDomain}
                             NEXT_PUBLIC_AQUA_PROJECT_ID=${projectId}
                          `,
							'utf8',
						),
					},
				]);

				await vercelSandbox.runCommand({
					cmd: 'npm',
					args: ['install'],
				});

				await vercelSandbox.runCommand({
					cmd: 'npm',
					args: ['run', 'dev'],
					detached: true,
				});

				// Health check
				const vercelSandboxDomain = vercelSandbox.domain(3000);

				// Increase wait time and add retry logic
				let attempts = 0;
				const maxAttempts = 10;
				let isAccessible = false;

				while (attempts < maxAttempts && !isAccessible) {
					try {
						await new Promise((resolve) => setTimeout(resolve, 3000));
						await this.httpService.axiosRef.get(vercelSandboxDomain);
						isAccessible = true;
					} catch {
						attempts++;
						this.logger.warn(
							`Sandbox URL ${vercelSandboxDomain} is not accessible yet (attempt ${attempts}/${maxAttempts})`,
						);
						if (attempts === maxAttempts) {
							this.logger.error(
								`Sandbox URL ${vercelSandboxDomain} failed to become accessible after ${maxAttempts} attempts`,
							);
						}
					}
				}

				await this.updateSandboxById(sandbox._id, {
					domain: vercelSandboxDomain,
					status: SandboxStatus.INITIALIZED,
					requestedAt: now,
					sandboxMetaData: {
						vercel: {
							sandboxId: vercelSandbox.sandboxId,
							vcpus: 2,
							memory: 4096,
							region: 'iad1',
							runtime: 'node22',
							timeout: ms(`${this.sandboxInactivityTimeout}Milliseconds`),
							cwd: '/vercel/sandbox',
							requestedAt: now,
							createdAt: now,
							updatedAt: now,
						},
					},
					createdAt: now,
					updatedAt: now,
				});

				// Broadcast sandbox process completed event
				this.messengerService.publish({
					eventName: 'sandbox.initialized',
					eventData: sandbox,
				});

				// Track the sandbox as active and set up lifecycle management
				this.initializeSandboxLifecycleByProjectId(projectId, sandbox);

				return vercelSandbox;
			} catch (error: unknown) {
				await sandbox.updateOne({ $set: { status: SandboxStatus.FAILED } });

				// Broadcast sandbox process failed event via PubSub
				this.messengerService.publish({
					eventName: 'sandbox.failed',
					eventData: sandbox,
				});

				this.logger.error('Failed to create sandbox', error);
				throw new InternalServerErrorException({
					errors: SandboxErrors.SANDBOX_CREATION_FAILED,
				});
			}
		}
	}

	async getVercelSandboxByProjectId(projectId: string): Promise<VercelSandbox> {
		const sandbox = await this.findSandboxRequestedInTheLast45MinutesByProjectID(projectId);
		if (!sandbox) {
			throw new NotFoundException({ errors: SandboxErrors.SANDBOX_ALREADY_EXISTS });
		}

		const { result: project } = await this.projectsService.getProjectById(projectId);
		const vercelProjectId = project.projectMetaData.vercel.projectId;
		const vercelSandboxId = sandbox.sandboxMetaData!.vercel.sandboxId;

		return this.vercelService.getSandbox({
			vercelProjectId,
			vercelSandboxId,
		});
	}

	async existVercelSandboxByProjectId(projectId: string): Promise<boolean> {
		const sandbox = await this.findSandboxRequestedInTheLast45MinutesByProjectID(projectId);
		return !!sandbox;
	}

	async closeVercelSandboxByProjectId(projectId: string): Promise<void> {
		try {
			const inactivityTimer = this.sandboxInactivityTimers.get(projectId);
			if (inactivityTimer) clearTimeout(inactivityTimer);
			this.sandboxInactivityTimers.delete(projectId);

			const maxTimeTimer = this.sandboxMaxTimeTimers.get(projectId);
			if (maxTimeTimer) clearTimeout(maxTimeTimer);
			this.sandboxMaxTimeTimers.delete(projectId);

			// Remove from active sandboxes
			const sandbox = this.activeSandboxes.get(projectId);
			if (sandbox) {
				// Now trigger preview build since sandbox lifecycle has ended
				const sandboxId = sandbox.sandbox._id;

				const vercelSandbox: VercelSandbox =
					await this.getVercelSandboxByProjectId(projectId).catch();
				if (vercelSandbox) {
					await vercelSandbox.stop();
				}

				this.activeSandboxes.delete(projectId);
				const { result: updatedSandbox } = await this.updateSandboxById(sandboxId, {
					status: SandboxStatus.CLOSED,
				});

				// Broadcast sandbox closure event
				this.messengerService.publish({
					eventName: 'sandbox.closed',
					eventData: updatedSandbox,
				});
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.logger.error(
					`Failed to close sandbox for project ${projectId}:`,
					error.message,
				);
			}
		}
	}

	async createSandboxFileByProjectId(projectId: string, path: string, content: string) {
		const vercelSandbox: VercelSandbox = await this.getVercelSandboxByProjectId(projectId);
		this.resetSandboxInactivityTimerByProjectId(projectId);

		try {
			const parent = path.includes('/') ? path.split('/').slice(0, -1).join('/') : '';

			if (parent) {
				await vercelSandbox.runCommand({
					cmd: 'mkdir',
					args: ['-p', parent],
				});
			}

			await vercelSandbox.writeFiles([{ path, content: Buffer.from(content, 'utf8') }]);

			await this.installDependenciesIfPackageJsonChangedByProjectId(
				projectId,
				vercelSandbox,
				path,
			);
		} catch (e) {
			this.logger.warn(
				`mirrorCreateFile failed for ${projectId}:${path} -> ${e instanceof Error ? e.message : String(e)}`,
			);
		}
	}

	private async installDependenciesIfPackageJsonChangedByProjectId(
		projectId: string,
		sandbox: VercelSandbox,
		changedPath: string,
	) {
		try {
			// Extract filename from a path (remove leading ./ and get basename)
			const normalizedPath = changedPath.replace(/^\.\/+/, ''); // Remove leading ./ or .//
			const fileName = pathPosix.basename(normalizedPath);

			// Only proceed if package.json was changed
			if (fileName !== 'package.json') return;

			// Prevent duplicate installations
			if (this.installingSandboxDependencies.has(projectId)) {
				return;
			}

			// Mark as installing
			this.installingSandboxDependencies.add(projectId);

			// Run npm install
			await sandbox.runCommand('npm', ['install']);
		} catch (e) {
			this.logger.warn(
				`npm install failed for ${projectId}: ${e instanceof Error ? e.message : String(e)}`,
			);
		} finally {
			this.installingSandboxDependencies.delete(projectId);
		}
	}

	private initializeSandboxLifecycleByProjectId(projectId: string, doc: SandboxDocument) {
		const now = new Date();

		// Track the sandbox
		this.activeSandboxes.set(projectId, {
			sandbox: { ...doc.toObject(), lastActivityAt: now },
		});

		this.updateSandboxById(doc._id, { lastActivityAt: now }).catch((error) => {
			this.logger.warn(`Failed to update lastActivityAt for sandbox ${doc._id}:`, error);
		});

		// Set up the inactivity timer (3 minutes)
		const inactivityTimer = setTimeout(() => {
			void this.closeVercelSandboxByProjectId(projectId);
		}, this.sandboxInactivityTimeout);
		this.sandboxInactivityTimers.set(projectId, inactivityTimer);

		// Set up the maximum time timer (45 minutes)
		const maxTimeTimer = setTimeout(() => {
			void this.closeVercelSandboxByProjectId(projectId).then();
		}, this.sandboxMaxTime);
		this.sandboxMaxTimeTimers.set(projectId, maxTimeTimer);
	}

	private resetSandboxInactivityTimerByProjectId(projectId: string): void {
		const sandbox = this.activeSandboxes.get(projectId);
		if (!sandbox) return;

		const now = new Date();
		sandbox.sandbox.lastActivityAt = now;
		this.activeSandboxes.set(projectId, sandbox);

		// Reset inactivity timer
		const existingTimer = this.sandboxInactivityTimers.get(projectId);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		const newTimer = setTimeout(() => {
			void this.closeVercelSandboxByProjectId(projectId);
		}, this.sandboxInactivityTimeout);
		this.sandboxInactivityTimers.set(projectId, newTimer);

		// Update sandbox
		this.updateSandboxById(sandbox.sandbox._id, { lastActivityAt: now }).catch((error) => {
			this.logger.warn(`Failed to update lastActivityAt for project ${projectId}:`, error);
		});
	}
}
