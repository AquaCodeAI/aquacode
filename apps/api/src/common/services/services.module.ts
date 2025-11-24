import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VercelModule } from './vercel';

@Module({
	imports: [
		VercelModule.forRootAsync({
			global: true,
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				vercelToken: config.getOrThrow<string>('VERCEL_TOKEN'),
				vercelTeamId: config.getOrThrow<string>('VERCEL_TEAM_ID'),
			}),
		}),
	],
	exports: [VercelModule],
})
export class ServicesModule {}
