import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
	BadRequestException,
	ConnectionsService,
	DeploymentTarget,
	flattenObject,
	generateULID,
	ItemResponseDto,
	ListResponseDto,
	MessengerService,
	NotFoundException,
	ProjectsService,
	VercelService,
} from '@aquacode/common';
import { DeploymentConnectionsService } from '@aquacode/modules/deployment-connections';
import { DeploymentFilesService } from '@aquacode/modules/deployment-files';
import { DeploymentMemoriesService } from '@aquacode/modules/deployment-memories';
import { DeploymentPoliciesService } from '@aquacode/modules/deployment-policies';
import { FilesService } from '@aquacode/modules/files';
import { MemoriesService } from '@aquacode/modules/memories';
import { PoliciesService } from '@aquacode/modules/policies';
import { SandboxesService } from '@aquacode/modules/sandboxes';
import { Model } from 'mongoose';
import {
	CreateDeploymentDto,
	CreateVercelPreviewDeploymentDto,
	DeploymentFilteringParameterDto,
	PromoteVercelPreviewDeploymentToProductionDto,
	RollbackToDeploymentDto,
	UpdateDeploymentDto,
} from './dtos';
import { DeploymentStatus, DeploymentType } from './enums';
import { DeploymentErrors } from './errors';
import { Deployment, DeploymentDocument } from './schemas';

@Injectable()
export class DeploymentsService {
	private readonly deploymentPrefix: string = 'dpl';
	private readonly aquaDomain: string;

	constructor(
		@InjectModel(Deployment.name)
		private readonly deploymentModel: Model<DeploymentDocument>,
		private readonly configService: ConfigService,
		private readonly projectsService: ProjectsService,
		private readonly messengerService: MessengerService,
		private readonly filesService: FilesService,
		private readonly deploymentFilesService: DeploymentFilesService,
		private readonly memoriesService: MemoriesService,
		private readonly deploymentMemoriesService: DeploymentMemoriesService,
		private readonly vercelService: VercelService,
		private readonly policiesService: PoliciesService,
		private readonly deploymentPoliciesService: DeploymentPoliciesService,
		private readonly connectionsService: ConnectionsService,
		private readonly deploymentConnectionsService: DeploymentConnectionsService,
		private readonly sandboxesService: SandboxesService,
	) {
		this.aquaDomain = this.configService.get<string>('AQUA_DOMAIN')!;
	}

	async getDeployments(
		filter: DeploymentFilteringParameterDto,
	): Promise<ListResponseDto<DeploymentDocument>> {
		const { page, perPage, projectId, type } = filter;

		let query = this.deploymentModel.find({
			projectId,
			...(type && { type }),
		});
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage).sort({ createdAt: -1 });
		}

		const result: DeploymentDocument[] = await query;
		const totalCount = await this.deploymentModel.countDocuments();

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

	async createDeployment(
		docContent: CreateDeploymentDto,
	): Promise<ItemResponseDto<DeploymentDocument>> {
		const deploymentId = generateULID(this.deploymentPrefix);
		const deployment = await this.deploymentModel.create({ _id: deploymentId, ...docContent });
		return {
			result: deployment,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getDeploymentById(deploymentId: string): Promise<ItemResponseDto<DeploymentDocument>> {
		const deployment = await this.deploymentModel.findOne({ _id: deploymentId });
		if (!deployment)
			throw new NotFoundException({ errors: DeploymentErrors.DEPLOYMENT_NOT_FOUND });
		return {
			result: deployment,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getDeploymentByIdAndType(
		deploymentId: string,
		type: DeploymentType,
	): Promise<ItemResponseDto<DeploymentDocument>> {
		const deployment = await this.deploymentModel.findOne({ _id: deploymentId, type });
		if (!deployment)
			throw new NotFoundException({ errors: DeploymentErrors.DEPLOYMENT_NOT_FOUND });
		return {
			result: deployment,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async updateDeploymentById(
		deploymentId: string,
		doc: UpdateDeploymentDto,
	): Promise<ItemResponseDto<DeploymentDocument>> {
		const flattenedDoc = flattenObject(doc as Record<string, any>);
		const deployment = await this.deploymentModel.findOneAndUpdate(
			{ _id: deploymentId },
			{ $set: flattenedDoc },
			{ new: true, runValidators: true, timestamps: true },
		);
		if (!deployment)
			throw new NotFoundException({ errors: DeploymentErrors.DEPLOYMENT_NOT_FOUND });
		return {
			result: deployment,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async createVercelPreviewDeployment(doc: CreateVercelPreviewDeploymentDto): Promise<void> {
		const { result: project } = await this.projectsService.getProjectById(doc.projectId);
		const { result: deployment } = await this.createDeployment({
			type: DeploymentType.PREVIEW,
			projectId: doc.projectId,
		});

		this.messengerService.publish({
			eventName: 'deployment.queued',
			eventData: deployment,
		});

		const { result: files } = await this.filesService.getFiles({
			projectId: project._id,
			page: 1,
			perPage: 1000,
		});

		await this.deploymentFilesService.insertDeploymentFiles({
			files: files.map((file) => ({
				name: file.name,
				content: file.content,
				projectId: doc.projectId,
				deploymentId: deployment._id,
			})),
		});

		const { result: memory } = await this.memoriesService.getMemoryByProjectId(doc.projectId);

		await this.deploymentMemoriesService.createDeploymentMemory({
			longTerm: memory.longTerm,
			projectId: deployment.projectId,
			deploymentId: deployment._id,
		});

		const { result: connection } = await this.connectionsService.getConnectionByName(
			project.connection,
		);

		await this.deploymentConnectionsService.createDeploymentConnection({
			name: connection.name,
			schemas: connection.schemas,
			deploymentId: deployment._id,
		});

		const { result: policies } = await this.policiesService.getPolicies({
			connection: project.connection,
			page: 1,
			perPage: 1000,
		});

		await this.deploymentPoliciesService.insertDeploymentPolicies({
			policies: policies.map((policy) => ({
				schemaName: policy.schemaName,
				policyName: policy.policyName,
				policyOperation: policy.policyOperation,
				policyFilterQuery: policy.policyFilterQuery,
				policyUpdateQuery: policy.policyUpdateQuery,
				connection: policy.connection,
				deploymentId: deployment._id,
			})),
		});

		const vercelDeployment = await this.vercelService.createDeployment({
			projectId: project.projectMetaData.vercel.projectId,
			projectName: project.name,
			projectFiles: [
				...files.map((file) => ({
					file: file.name,
					data: file.content,
				})),
				{
					file: '.env',
					data: `
                            NEXT_PUBLIC_AQUA_DOMAIN=${this.aquaDomain}
                            NEXT_PUBLIC_AQUA_PROJECT_ID=${doc.projectId}
                            NEXT_PUBLIC_AQUA_DEPLOYMENT_ID=${deployment._id}
                        `,
				},
			],
		});

		if (!vercelDeployment.alias || vercelDeployment.alias.length === 0) {
			throw new BadRequestException({
				errors: DeploymentErrors.PREVIEW_DOMAIN_CREATION_FAILED,
			});
		}

		await this.updateDeploymentById(deployment._id, {
			domain: vercelDeployment.url,
			deploymentMetaData: {
				vercel: {
					id: vercelDeployment.id,
				},
			},
		});

		const finalStatus = await this.pollVercelDeploymentStatus(
			vercelDeployment.id,
			deployment._id,
		);

		this.handleFinalDeploymentStatus(finalStatus, deployment);
	}

	async promoteVercelPreviewDeploymentToProduction(
		doc: PromoteVercelPreviewDeploymentToProductionDto,
	): Promise<void> {
		const { result: previewDeployment } = await this.getDeploymentByIdAndType(
			doc.deploymentId,
			DeploymentType.PREVIEW,
		);
		const { result: project } = await this.projectsService.getProjectById(
			previewDeployment.projectId,
		);

		const { result: productionDeployment } = await this.createDeployment({
			type: DeploymentType.PRODUCTION,
			projectId: previewDeployment.projectId,
			promotedFrom: previewDeployment._id,
			promotedAt: new Date(),
		});

		this.messengerService.publish({
			eventName: 'deployment.queued',
			eventData: productionDeployment,
		});

		const { result: deploymentFiles } = await this.deploymentFilesService.getDeploymentFiles({
			deploymentId: previewDeployment._id,
			page: 1,
			perPage: 1000,
		});

		await this.deploymentFilesService.insertDeploymentFiles({
			files: deploymentFiles.map((file) => ({
				name: file.name,
				content: file.content,
				projectId: productionDeployment.projectId,
				deploymentId: productionDeployment._id,
			})),
		});

		const { result: deploymentMemory } =
			await this.deploymentMemoriesService.getDeploymentMemoryByDeploymentId(
				doc.deploymentId,
			);

		await this.deploymentMemoriesService.createDeploymentMemory({
			longTerm: deploymentMemory.longTerm || [],
			projectId: productionDeployment.projectId,
			deploymentId: productionDeployment._id,
		});

		const { result: deploymentConnection } =
			await this.deploymentConnectionsService.getDeploymentConnectionByDeploymentId(
				doc.deploymentId,
			);

		await this.deploymentConnectionsService.createDeploymentConnection({
			name: deploymentConnection.name,
			schemas: deploymentConnection.schemas,
			deploymentId: productionDeployment._id,
		});

		const { result: deploymentPolicies } = await this.deploymentPoliciesService.getPolicies({
			deploymentId: previewDeployment._id,
			page: 1,
			perPage: 1000,
		});

		await this.deploymentPoliciesService.insertDeploymentPolicies({
			policies: deploymentPolicies.map((policy) => ({
				schemaName: policy.schemaName,
				policyName: policy.policyName,
				policyOperation: policy.policyOperation,
				policyFilterQuery: policy.policyFilterQuery,
				policyUpdateQuery: policy.policyUpdateQuery,
				connection: policy.connection,
				deploymentId: productionDeployment._id,
			})),
		});

		const vercelDeployment = await this.vercelService.createDeployment({
			projectId: project.projectMetaData.vercel.projectId,
			projectName: project.name,
			deploymentId: previewDeployment.deploymentMetaData!.vercel.id,
			target: DeploymentTarget.PRODUCTION,
		});

		if (!vercelDeployment.alias || vercelDeployment.alias.length === 0) {
			throw new BadRequestException({
				errors: DeploymentErrors.PREVIEW_DOMAIN_CREATION_FAILED,
			});
		}

		await this.updateDeploymentById(productionDeployment._id, {
			domain: vercelDeployment.url,
			isActive: true,
			deploymentMetaData: {
				vercel: {
					id: vercelDeployment.id,
				},
			},
		});

		await this.deploymentModel.updateMany(
			{
				_id: { $ne: productionDeployment._id },
				type: DeploymentType.PRODUCTION,
				projectId: productionDeployment.projectId,
			},
			{
				$set: {
					isActive: false,
				},
			},
		);

		const finalStatus = await this.pollVercelDeploymentStatus(
			vercelDeployment.id,
			productionDeployment._id,
		);

		this.handleFinalDeploymentStatus(finalStatus, productionDeployment);
	}

	async rollbackToDeployment(doc: RollbackToDeploymentDto): Promise<void> {
		const { result: targetDeployment } = await this.getDeploymentById(doc.deploymentId);

		if (targetDeployment.status !== DeploymentStatus.READY) {
			throw new BadRequestException({
				errors: DeploymentErrors.ROLLBACK_REQUIRES_READY_STATUS,
			});
		}

		if (targetDeployment?.type === DeploymentType.PRODUCTION) {
			throw new BadRequestException({
				errors: DeploymentErrors.ROLLBACK_PRODUCTION_NOT_ALLOWED,
			});
		}

		if (targetDeployment.isRollback) {
			throw new BadRequestException({
				errors: DeploymentErrors.ROLLBACK_TO_ROLLBACK_NOT_ALLOWED,
			});
		}

		const currentActiveDeployment = await this.deploymentModel
			.findOne({ projectId: targetDeployment.projectId, type: DeploymentType.PREVIEW })
			.sort({ createdAt: -1 });

		if (currentActiveDeployment?._id === targetDeployment._id) {
			throw new BadRequestException({
				errors: DeploymentErrors.DEPLOYMENT_ALREADY_ACTIVE,
			});
		}

		if (currentActiveDeployment?.isRollback) {
			if (currentActiveDeployment.rolledBackTo === targetDeployment._id) {
				throw new BadRequestException({
					errors: DeploymentErrors.ROLLBACK_IN_PROGRESS,
				});
			}
		}

		const hasSandbox = await this.sandboxesService.existVercelSandboxByProjectId(
			targetDeployment.projectId,
		);
		if (hasSandbox) {
			throw new BadRequestException({
				errors: DeploymentErrors.ROLLBACK_BLOCKED_BY_SANDBOX,
			});
		}

		const { result: rollbackDeployment } = await this.createDeployment({
			type: DeploymentType.PREVIEW,
			projectId: targetDeployment.projectId,
			domain: targetDeployment.domain,
			rolledBackFrom: currentActiveDeployment?._id,
			rolledBackTo: targetDeployment._id,
			rolledBackAt: new Date(),
			isRollback: true,
			deploymentMetaData: targetDeployment?.deploymentMetaData,
		});

		const { result: deploymentFiles } = await this.deploymentFilesService.getDeploymentFiles({
			deploymentId: targetDeployment._id,
			page: 1,
			perPage: 1000,
		});
		await this.filesService.rollbackFilesByProjectId(rollbackDeployment.projectId, {
			files: deploymentFiles.map((file) => ({
				name: file.name,
				content: file.content,
			})),
		});

		const { result: targetMemory } =
			await this.deploymentMemoriesService.getDeploymentMemoryByDeploymentId(
				targetDeployment._id,
			);
		await this.memoriesService.rollbackMemoryByProjectId(rollbackDeployment.projectId, {
			longTerm: targetMemory.longTerm,
		});

		const { result: deploymentConnection } =
			await this.deploymentConnectionsService.getDeploymentConnectionByDeploymentId(
				targetDeployment._id,
			);
		await this.connectionsService.rollbackConnectionByName(deploymentConnection.name, {
			schemas: deploymentConnection.schemas,
		});

		const { result: targetPolicies } = await this.deploymentPoliciesService.getPolicies({
			deploymentId: targetDeployment._id,
			page: 1,
			perPage: 1000,
		});
		if (targetPolicies.length > 0) {
			await this.policiesService.rollbackPoliciesByConnection(targetDeployment._id, {
				policies: targetPolicies.map((policy) => ({
					policyName: policy.policyName,
					schemaName: policy.schemaName,
					policyOperation: policy.policyOperation,
					policyFilterQuery: policy.policyFilterQuery,
					policyUpdateQuery: policy.policyUpdateQuery,
					connection: policy.connection,
				})),
			});
		}

		await this.updateDeploymentById(rollbackDeployment._id, {
			status: DeploymentStatus.READY,
			isActive: true,
		});

		await this.deploymentModel.updateMany(
			{
				_id: { $ne: rollbackDeployment._id },
				type: DeploymentType.PREVIEW,
				projectId: targetDeployment.projectId,
			},
			{ $set: { isActive: false } },
		);
	}

	private handleFinalDeploymentStatus(
		finalStatus: DeploymentStatus,
		deployment: DeploymentDocument,
	): void {
		switch (finalStatus) {
			case DeploymentStatus.QUEUED:
				this.messengerService.publish({
					eventName: 'deployment.queued',
					eventData: deployment,
				});
				break;
			case DeploymentStatus.READY:
				this.messengerService.publish({
					eventName: 'deployment.ready',
					eventData: deployment,
				});
				break;
			case DeploymentStatus.BUILDING:
				this.messengerService.publish({
					eventName: 'deployment.building',
					eventData: deployment,
				});
				break;
			case DeploymentStatus.ERROR:
				this.messengerService.publish({
					eventName: 'deployment.failed',
					eventData: deployment,
				});
				throw new BadRequestException({
					errors: DeploymentErrors.DEPLOYMENT_FAILED,
				});
			case DeploymentStatus.CANCELED:
				this.messengerService.publish({
					eventName: 'deployment.canceled',
					eventData: deployment,
				});
				throw new BadRequestException({
					errors: DeploymentErrors.DEPLOYMENT_CANCELED,
				});
			case DeploymentStatus.INITIALIZING:
				this.messengerService.publish({
					eventName: 'deployment.initializing',
					eventData: deployment,
				});
				break;
		}
	}

	private async pollVercelDeploymentStatus(
		vercelDeploymentId: string,
		deploymentId: string,
	): Promise<DeploymentStatus> {
		const POLLING_INTERVAL = 5000;
		const FINAL_STATES: DeploymentStatus[] = [
			DeploymentStatus.READY,
			DeploymentStatus.ERROR,
			DeploymentStatus.CANCELED,
		];

		while (true) {
			await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));

			const vercelDeployment = await this.vercelService.getDeploymentById(vercelDeploymentId);

			const status = vercelDeployment.status as DeploymentStatus;

			await this.updateDeploymentById(deploymentId, { status });

			if (FINAL_STATES.includes(status)) {
				return status;
			}
		}
	}
}
