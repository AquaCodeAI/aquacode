import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateContentParameters, GoogleGenAI } from '@google/genai';
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

// Map of simplified to actual model names for Google Gemini models.
const GEMINI_MODEL_MAP: Record<string, string> = {
	'gemini-3-pro-preview': 'gemini-3-pro-preview',
};

@Injectable()
export class GoogleProvider implements ModelProvider {
	providerId = 'gemini';

	private readonly logger = new Logger(GoogleProvider.name);
	private readonly client: GoogleGenAI;
	private readonly circuitBreaker: CircuitBreakerPolicy;

	constructor(private readonly config: ConfigService) {
		const key = this.config.get<string>('GEMINI_API_KEY');
		this.client = new GoogleGenAI({ apiKey: key });

		this.circuitBreaker = circuitBreaker(handleAll, {
			halfOpenAfter: 15000,
			breaker: new ConsecutiveBreaker(3),
		});
		this.setupCircuitBreakerEvents();
	}

	supportsModel(modelId: string): boolean {
		return modelId in GEMINI_MODEL_MAP;
	}

	async generate(
		modelId: string,
		input: ProviderGenerateInput,
		options?: ProviderGenerateOptions,
	): Promise<ProviderGenerateResult> {
		const started = Date.now();
		const actualModel = GEMINI_MODEL_MAP[modelId];

		const systemContent = options?.systemPrompt ?? '';

		const wantStream = typeof options?.onToken === 'function';

		if (wantStream) {
			const streamingPayload: GenerateContentParameters = {
				model: actualModel,
				contents: input.prompt,
				config: {
					systemInstruction: systemContent,
					maxOutputTokens: options?.maxTokens ?? 64000,
					abortSignal: options?.abortSignal,
				},
			};

			const stream = await this.circuitBreaker.execute(() =>
				this.client.models.generateContentStream(streamingPayload),
			);

			// Streaming branch: accumulate deltas and invoke onToken for each piece
			let fullText = '';
			const onToken = options.onToken!;

			for await (const chunk of stream) {
				const text = chunk.text ?? '';
				fullText += text;
				onToken(text);
			}

			const latencyMs = Date.now() - started;
			this.logger.log(`Google (stream) model=${actualModel} latencyMs=${latencyMs}`);

			return {
				model: modelId,
				text: String(fullText),
			};
		}

		const noStreamingPayload: GenerateContentParameters = {
			model: actualModel,
			contents: input.prompt,
			config: {
				systemInstruction: systemContent,
				maxOutputTokens: options?.maxTokens ?? 64000,
				abortSignal: options?.abortSignal,
			},
		};

		const response = await this.circuitBreaker.execute(() =>
			this.client.models.generateContent(noStreamingPayload),
		);

		const text = response.text ?? '';

		const latencyMs = Date.now() - started;
		this.logger.log(`Google model=${actualModel} latencyMs=${latencyMs}`);

		return {
			model: modelId,
			text: String(text),
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
