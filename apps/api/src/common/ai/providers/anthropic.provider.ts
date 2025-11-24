import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
	circuitBreaker,
	CircuitBreakerPolicy,
	ConsecutiveBreaker,
	handleAll,
	IFailureEvent,
} from 'cockatiel';
import {
	ModelProvider,
	ProviderGenerateInput,
	ProviderGenerateOptions,
	ProviderGenerateResult,
} from '../types';

type AnthropicStreamingPayload = {
	model: string;
	messages: { role: 'user' | 'assistant'; content: string }[];
	system?: string | { text: string; type: 'text' }[];
	max_tokens: number;
	stream?: boolean;
};

type AnthropicNoStreamingPayload = Omit<AnthropicStreamingPayload, 'stream'>;

// Map of simplified to actual model names for Anthropic Claude models.
const CLAUDE_MODEL_MAP: Record<string, string> = {
	'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
};

@Injectable()
export class AnthropicProvider implements ModelProvider {
	providerId = 'anthropic';

	private readonly logger = new Logger(AnthropicProvider.name);
	private readonly client: Anthropic;
	private readonly circuitBreaker: CircuitBreakerPolicy;

	constructor(private readonly config: ConfigService) {
		const key = this.config.get<string>('ANTHROPIC_API_KEY');
		this.client = new Anthropic({ apiKey: key });

		this.circuitBreaker = circuitBreaker(handleAll, {
			halfOpenAfter: 15000,
			breaker: new ConsecutiveBreaker(3),
		});
		this.setupCircuitBreakerEvents();
	}

	supportsModel(modelId: string): boolean {
		return modelId in CLAUDE_MODEL_MAP;
	}

	async generate(
		modelId: string,
		input: ProviderGenerateInput,
		options?: ProviderGenerateOptions,
	): Promise<ProviderGenerateResult> {
		const started = Date.now();
		const actualModel = CLAUDE_MODEL_MAP[modelId];

		const systemContent = options?.systemPrompt ?? '';

		const wantStream = typeof options?.onToken === 'function';

		if (wantStream) {
			const streamingPayload: AnthropicStreamingPayload = {
				model: actualModel,
				messages: [{ role: 'user', content: input.prompt }],
				system: systemContent,
				stream: true,
				max_tokens: options?.maxTokens ?? 64000,
			};

			const stream = await this.circuitBreaker.execute(() =>
				this.client.messages.stream(streamingPayload, {
					signal: options?.abortSignal,
				}),
			);

			// Streaming branch: accumulate deltas and invoke onToken for each piece
			let fullText = '';
			const onToken = options.onToken!;

			stream.on('text', (delta: string) => {
				fullText += delta;
				onToken(delta);
			});

			await stream.done();

			const latencyMs = Date.now() - started;
			this.logger.log(`Anthropic (stream) model=${actualModel} latencyMs=${latencyMs}`);

			return {
				model: modelId,
				text: fullText,
			};
		}

		const noStreamingPayload: AnthropicNoStreamingPayload = {
			model: actualModel,
			messages: [{ role: 'user', content: input.prompt }],
			system: systemContent,
			max_tokens: options?.maxTokens ?? 64000,
		};

		const response = await this.circuitBreaker.execute(async () =>
			this.client.messages.create(noStreamingPayload, { signal: options?.abortSignal }),
		);

		const contentBlocks = response?.content ?? [];
		const content = Array.isArray(contentBlocks)
			? contentBlocks
					.map((b) => {
						if ('text' in b && typeof b.text === 'string') return b.text;
						return '';
					})
					.join('')
			: '';
		const usage = response?.usage;

		const latencyMs = Date.now() - started;
		this.logger.log(
			`Anthropic model=${actualModel} tokensIn=${usage?.input_tokens ?? 0} tokensOut=${usage?.output_tokens ?? 0} latencyMs=${latencyMs}`,
		);

		return {
			model: modelId,
			text: String(content),
		};
	}

	/**
	 * Sets up event handlers for the circuit breaker
	 */
	private setupCircuitBreakerEvents(): void {
		this.circuitBreaker.onHalfOpen(() =>
			this.logger.warn('Circuit breaker in half-open state'),
		);

		this.circuitBreaker.onBreak(() =>
			this.logger.error('Circuit breaker opened! Anthropic operations will fail fast'),
		);

		this.circuitBreaker.onFailure(({ reason }: IFailureEvent) => {
			const error = reason as unknown;
			const msg = 'Circuit breaker failure threshold reached';
			if (error instanceof Error) {
				this.logger.error(msg, error.stack);
			} else {
				this.logger.error(msg);
			}
		});
	}
}
