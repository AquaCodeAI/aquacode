import { Injectable } from '@nestjs/common';
import { NotFoundException, RequestTimeoutException } from '@aquacode/common/exceptions';
import { AiErrors } from './errors';
import { AnthropicProvider, GoogleProvider } from './providers';
import {
	ModelProvider,
	ProviderGenerateInput,
	ProviderGenerateOptions,
	ProviderGenerateResult,
} from './types';

function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs?: number,
	onTimeout?: () => void,
): Promise<T> {
	if (!timeoutMs || timeoutMs <= 0) return promise;
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			try {
				onTimeout?.();
			} catch {}
			reject(new RequestTimeoutException({ errors: AiErrors.REQUEST_TIMEOUT }));
		}, timeoutMs);
		promise.then(
			(v) => {
				clearTimeout(timer);
				resolve(v);
			},
			(e) => {
				clearTimeout(timer);
				reject(e);
			},
		);
	});
}

@Injectable()
export class ProviderRegistry {
	private providers: ModelProvider[];

	constructor(anthropic: AnthropicProvider, google: GoogleProvider) {
		this.providers = [anthropic, google];
	}

	/**
	 * Generates a result using the specified model and input data.
	 */
	async generate(
		modelId: string,
		input: ProviderGenerateInput,
		options?: ProviderGenerateOptions,
	): Promise<ProviderGenerateResult> {
		const provider = this.getProviderForModel(modelId);
		const hasExternalSignal = !!options?.abortSignal;
		const ac = hasExternalSignal
			? undefined
			: typeof AbortController !== 'undefined'
				? new AbortController()
				: undefined;

		const promise = provider.generate(modelId, input, {
			...options,
			abortSignal: options?.abortSignal ?? ac?.signal,
		});

		return withTimeout(promise, options?.timeoutMs, () => ac?.abort());
	}

	/**
	 * Resolves the provider capable of handling the specified model id.
	 */
	private getProviderForModel(modelId: string): ModelProvider {
		const provider = this.providers.find((p) => p.supportsModel(modelId));
		if (!provider) throw new NotFoundException({ errors: AiErrors.PROVIDER_NOT_FOUND });
		return provider;
	}
}
