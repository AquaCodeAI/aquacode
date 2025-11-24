import { Injectable } from '@nestjs/common';
import {
	BadRequestException,
	CacheService,
	ConnectionsService,
	ProjectsService,
} from '@aquacode/common';
import { FilesService } from '@aquacode/modules/files';
import { JobsService } from '@aquacode/modules/jobs';
import { MemoriesService } from '@aquacode/modules/memories';
import { MessageRole, MessagesService, MessageStatus } from '@aquacode/modules/messages';
import { PoliciesService } from '@aquacode/modules/policies';
import { SandboxesService } from '@aquacode/modules/sandboxes';
import { createHash } from 'crypto';
import type { Response } from 'express';
import { ChatDto } from './dtos';
import { ChatErrors } from './errors';
import {
	ChatCodeGeneratorService,
	ChatContextDiscoveryService,
	ChatMemoryExtractorService,
	ChatSummaryService,
	ChatSystemPromptBuilderService,
} from './services';
import { ChatParseAquaBlocksService } from './utils';

interface ChatStreamState {
	aiMessageId: string;
	connections: Set<Response>;
	buffer: string[];
	abort: AbortController;
	manuallyAborted?: boolean;
	heartbeatInterval?: NodeJS.Timeout;
}

interface BroadcastPayload {
	eventName?: string;
	eventData?: unknown;
}

const broadcast = (payload: BroadcastPayload, state: ChatStreamState) => {
	const lines: string[] = [];
	if (payload.eventName) lines.push(`eventName: ${payload.eventName}`);

	// Data can be string or object
	let dataStr: string;
	if (typeof payload.eventData === 'string') {
		dataStr = payload.eventData;
	} else {
		try {
			dataStr = JSON.stringify(payload.eventData ?? {});
		} catch {
			dataStr = JSON.stringify({ error: 'Unserializable eventData' });
		}
	}

	// split by lines
	for (const ln of dataStr.split('\n')) {
		lines.push(`eventData: ${ln}`);
	}

	const frame = lines.join('\n') + '\n\n';
	state.buffer.push(frame);

	// send it to all active connections
	for (const conn of [...state.connections]) {
		if (!conn.writableEnded) {
			try {
				conn.write(frame);
			} catch {
				try {
					conn.end();
				} catch {}
				state.connections.delete(conn);
			}
		} else {
			state.connections.delete(conn);
		}
	}
};

@Injectable()
export class ChatService {
	private readonly streams: Map<string, ChatStreamState> = new Map();

	constructor(
		private readonly projectService: ProjectsService,
		private readonly connectionService: ConnectionsService,
		private readonly messageService: MessagesService,
		private readonly sandboxesService: SandboxesService,
		private readonly jobsService: JobsService,
		private readonly memoriesService: MemoriesService,
		private readonly filesService: FilesService,
		private readonly chatContextDiscoveryService: ChatContextDiscoveryService,
		private readonly chatSystemPromptBuilderService: ChatSystemPromptBuilderService,
		private readonly chatBuilderService: ChatCodeGeneratorService,
		private readonly chatParseAquaBlocksService: ChatParseAquaBlocksService,
		private readonly chatSummaryService: ChatSummaryService,
		private readonly chatMemoryBuilderService: ChatMemoryExtractorService,
		private readonly policiesService: PoliciesService,
		private readonly cacheService: CacheService,
	) {}

	async startChat(doc: ChatDto, res: Response): Promise<void> {
		const { message, currentRoute, userId, projectId, userMessageId, aiMessageId, aiModelId } =
			doc;

		const existing = this.streams.get(userMessageId);
		if (existing) {
			res.end();
			throw new BadRequestException({ errors: ChatErrors.CHAT_SESSION_IN_PROGRESS });
		}

		const { result: project } = await this.projectService.getProjectById(projectId);
		const { result: connection } = await this.connectionService.getConnectionByName(
			project.connection,
		);

		await this.messageService.createMessage({
			_id: userMessageId,
			role: MessageRole.USER,
			status: MessageStatus.COMPLETED,
			content: message.trim(),
			userId,
			projectId,
		});

		const { result: aiMessage } = await this.messageService.createMessage({
			_id: aiMessageId,
			role: MessageRole.AI,
			status: MessageStatus.IN_PROGRESS,
			content: null,
			projectId,
		});

		const state: ChatStreamState = {
			abort: new AbortController(),
			aiMessageId,
			connections: new Set<Response>(),
			buffer: [],
			manuallyAborted: false,
		};

		this.streams.set(userMessageId, state);
		state.connections.add(res);

		state.heartbeatInterval = setInterval(() => {
			broadcast({ eventName: 'heartbeat', eventData: { timestamp: Date.now() } }, state);
		}, 30000);

		const sandboxActivityInterval = setInterval(async () => {
			try {
				await this.sandboxesService.updateSandboxActivityByProjectId(projectId);
			} catch {}
		}, 60000);

		try {
			const hasActiveSandbox =
				await this.sandboxesService.existVercelSandboxByProjectId(projectId);
			if (!hasActiveSandbox) await this.jobsService.queueSandboxCreation({ projectId });

			const { result: memory } = await this.memoriesService.getMemoryByProjectId(projectId);
			const { result: recentMessages } = await this.messageService.getMessages({
				projectId,
				page: 1,
				perPage: 20,
			});
			const { result: projectStructure } =
				await this.filesService.getFileStructureByProjectId(projectId);

			const discoverySystemPrompt =
				this.chatSystemPromptBuilderService.buildPromptForDiscovery(
					memory,
					recentMessages,
					projectStructure,
				);
			const relevantFiles = await this.chatContextDiscoveryService.discover(
				message,
				projectId,
				projectStructure,
				currentRoute,
				discoverySystemPrompt,
				aiModelId,
				state.abort.signal,
			);

			const { result: policies } = await this.policiesService.getPolicies({
				connection: connection.name,
				page: 1,
				perPage: 1000,
			});
			const codeGenerationSystemPrompt =
				this.chatSystemPromptBuilderService.buildPromptForCodeGeneration(
					memory,
					recentMessages,
					projectStructure,
					connection,
					policies,
					relevantFiles,
				);

			let accumulatedText = '';
			const seenOperations = new Set<string>();

			const onToken = async (chunk: string) => {
				accumulatedText = (accumulatedText || '') + chunk;

				const blocks = this.chatParseAquaBlocksService
					.parseAquaBlocks(accumulatedText)
					.filter((block) => block.data && typeof block.data === 'object');

				if (!blocks.length) return;

				const pendingKey = `project:${projectId}:aqua:pending`;

				for (const b of blocks) {
					const aquaTool = b.name;
					const aquaData = b.data;

					if (aquaTool === 'aqua-think' || aquaTool === 'aqua-summarize') {
						continue;
					}

					const hash = createHash('sha256')
						.update(`${aquaTool}:${JSON.stringify(aquaData)}`)
						.digest('hex')
						.slice(0, 16);
					const operationKey = `aqua-tool:${aquaTool}:${hash}`;

					if (seenOperations.has(operationKey)) continue;
					seenOperations.add(operationKey);

					switch (aquaTool) {
						case 'aqua-schema': {
							try {
								await this.connectionService.upsertSchemaConnectionByName(
									connection.name,
									aquaData,
								);
							} catch {}
							break;
						}
						case 'aqua-policy': {
							try {
								await this.policiesService.upsertPolicy({
									...aquaData,
									connection: connection.name,
								});
							} catch {}
							break;
						}
						case 'aqua-write': {
							const filePath = b.data?.file_path;
							const fileContent = b.data?.content;

							if (typeof filePath === 'string' && typeof fileContent === 'string') {
								const hasSandbox =
									await this.sandboxesService.existVercelSandboxByProjectId(
										projectId,
									);
								if (!hasSandbox) {
									await this.cacheService.rpush(pendingKey, {
										type: 'aqua-write',
										file_path: filePath,
										content: fileContent,
									});
								} else {
									await this.filesService.applyQueuedFileChangesByProjectId(
										projectId,
									);
									await this.filesService.upsertFileInSandboxByProjectId(
										projectId,
										{
											name: filePath,
											content: fileContent,
										},
									);
								}
							}
							break;
						}
					}
				}

				aiMessage.content = accumulatedText;
				broadcast({ eventName: 'message', eventData: aiMessage }, state);
			};
			const built = await this.chatBuilderService.build(
				message,
				codeGenerationSystemPrompt,
				onToken,
				aiModelId,
				state.abort.signal,
			);
			if (!built) {
				throw new BadRequestException({ errors: ChatErrors.CHAT_BUILD_FAILED });
			}

			let summary: string | null = null;
			if (built) {
				summary = await this.chatSummaryService.summary(
					message,
					built,
					aiModelId,
					state.abort.signal,
				);
			}

			try {
				const longMemoryValue = await this.chatMemoryBuilderService.memory(
					message,
					built,
					aiModelId,
					state.abort.signal,
				);

				if (longMemoryValue && longMemoryValue.value) {
					await this.memoriesService.pushMemoryLongTermByProjectId(
						projectId,
						longMemoryValue.value,
					);
				}
			} catch {}

			await this.jobsService.queuePreviewDeployment({ projectId }).catch(() => void 0);

			const { result: updatedMessage } = await this.messageService.updateMessageById(
				aiMessageId,
				{
					status: MessageStatus.COMPLETED,
					content: built,
					summary,
				},
			);
			broadcast({ eventName: 'message', eventData: updatedMessage }, state);
		} catch (e) {
			if (!state.manuallyAborted) {
				const { result: failedMessage } = await this.messageService.updateMessageById(
					aiMessageId,
					{
						status: MessageStatus.FAILED,
						content:
							aiMessage.content || 'Failed to start chat. Please try again later.',
					},
				);

				broadcast(
					{
						eventName: 'message',
						eventData: failedMessage,
					},
					state,
				);
			}
			throw e;
		} finally {
			if (state.heartbeatInterval) {
				clearInterval(state.heartbeatInterval);
			}
			if (sandboxActivityInterval) {
				clearInterval(sandboxActivityInterval);
			}
			for (const conn of state.connections) {
				try {
					conn.end();
				} catch {}
			}
			this.streams.delete(userMessageId);
		}
	}

	async reconnectChat(userMessageId: string, res: Response): Promise<void> {
		const state = this.streams.get(userMessageId);
		if (!state) {
			try {
				res.end();
			} catch {}
			return;
		}

		state.connections.add(res);

		for (const frame of state.buffer) {
			if (res.writableEnded) break;
			try {
				res.write(frame);
			} catch {
				try {
					res.end();
				} catch {}
				state.connections.delete(res);
				return;
			}
		}
	}

	async cancelChat(userMessageId: string): Promise<void> {
		const state = this.streams.get(userMessageId);
		if (!state) return;
		try {
			state.manuallyAborted = true;
			const { result: canceledMessage } = await this.messageService.updateMessageById(
				state.aiMessageId,
				{
					status: MessageStatus.FAILED,
				},
			);
			broadcast({ eventName: 'message', eventData: canceledMessage }, state);
			state.abort.abort();
		} catch {}
		if (state.heartbeatInterval) {
			clearInterval(state.heartbeatInterval);
		}
		for (const conn of state.connections) {
			try {
				conn.end();
			} catch {}
		}
		this.streams.delete(userMessageId);
	}
}
