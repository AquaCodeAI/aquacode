import { type DynamicModule, Global, Module, type Provider } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE_MODULE_OPTIONS } from './constants';
import type { CacheModuleAsyncOptions } from './interfaces';

@Global()
@Module({})
export class CacheModule {
	static forRootAsync(options: CacheModuleAsyncOptions): DynamicModule {
		return {
			global: options.global ?? false,
			module: CacheModule,
			imports: options.imports ?? [],
			providers: [...this.createAsyncProviders(options), CacheService],
			exports: [CacheService],
		};
	}

	private static createAsyncProviders(options: CacheModuleAsyncOptions): Provider[] {
		return [
			{
				provide: CACHE_MODULE_OPTIONS,
				useFactory: options.useFactory,
				inject: options.inject ?? [],
			},
		];
	}
}
