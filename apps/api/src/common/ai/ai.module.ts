import { Global, Module } from '@nestjs/common';
import { ProviderRegistry } from './ai.provider';
import { AnthropicProvider, GoogleProvider } from './providers';

@Global()
@Module({
	providers: [ProviderRegistry, AnthropicProvider, GoogleProvider],
	exports: [ProviderRegistry],
})
export class AiModule {}
