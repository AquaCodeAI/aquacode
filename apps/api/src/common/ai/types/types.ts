export type ProviderGenerateOptions = {
	/**
	 * Specifies the maximum number of tokens that can be generated in the response.
	 */
	maxTokens?: number;

	/**
	 * Optional system prompt override used to steer the assistant's behavior.
	 * When provided, this replaces the default system prompt configured for the model.
	 */
	systemPrompt?: string;

	/**
	 * Optional streaming callback to receive incremental tokens/text chunks as they are generated.
	 * If defined, the provider should call this function with each partial text segment.
	 */
	onToken?: (chunk: string) => void;

	/**
	 * Optional timeout in milliseconds for the generation request.
	 * If the generation takes longer than this duration, the request will be aborted.
	 * When not specified, the provider's default timeout will be used.
	 */
	timeoutMs?: number;

	/**
	 * Optional abort signal to cancel generation midway.
	 * Providers should regularly check this signal and stop generation when it is aborted.
	 */
	abortSignal?: AbortSignal;
};

/**
 * Input payload sent to a model provider to request text generation.
 */
export type ProviderGenerateInput = {
	/**
	 * The user-facing prompt or message content that the model should respond to.
	 */
	prompt: string;
};

/**
 * Standardized response returned by a model provider after text generation.
 */
export type ProviderGenerateResult = {
	/**
	 * Identifier of the model that produced this result (e.g. "claude-sonnet-4.5").
	 */
	model: string;

	/**
	 * Final generated text content returned by the provider.
	 */
	text: string;
};

/**
 * Common interface that all model providers must implement.
 * This allows the rest of the application to interact with different providers
 * (OpenAI, Anthropic, local models, etc.) through a unified API.
 */
export interface ModelProvider {
	/**
	 * Provider id, only available "anthropic".
	 */
	providerId: string;

	/**
	 * Returns true if this provider can handle the given model id.
	 *
	 * @param modelId - The model identifier to check (provider-specific string).
	 */
	supportsModel(modelId: string): boolean;

	/**
	 * Generates the desired output based on the provided input and model configuration.
	 * @returns A promise that resolves with the standardized generation result.
	 */
	generate(
		modelId: string,
		input: ProviderGenerateInput,
		options?: ProviderGenerateOptions,
	): Promise<ProviderGenerateResult>;
}
