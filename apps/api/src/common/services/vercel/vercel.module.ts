import { type DynamicModule, Global, Module, type Provider } from '@nestjs/common';
import { Vercel } from '@vercel/sdk';
import { VERCEL_CLIENT, VERCEL_MODULE_OPTIONS } from './constants';
import type { VercelModuleAsyncOptions, VercelModuleOptions } from './interfaces';
import { VercelService } from './vercel.service';

@Global()
@Module({})
export class VercelModule {
	static forRootAsync(options: VercelModuleAsyncOptions): DynamicModule {
		return {
			global: options.global ?? false,
			module: VercelModule,
			imports: options.imports ?? [],
			providers: [
				...this.createAsyncProviders(options),
				{
					provide: VERCEL_CLIENT,
					useFactory: (opts: VercelModuleOptions) => {
						return new Vercel({ bearerToken: opts.vercelToken });
					},
					inject: [VERCEL_MODULE_OPTIONS],
				},
				VercelService,
			],
			exports: [VercelService, VERCEL_CLIENT],
		};
	}

	private static createAsyncProviders(options: VercelModuleAsyncOptions): Provider[] {
		return [
			{
				provide: VERCEL_MODULE_OPTIONS,
				useFactory: options.useFactory,
				inject: options.inject ?? [],
			},
		];
	}
}
