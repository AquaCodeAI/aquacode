import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common';
import { getEnvironment, validateEnvironmentVariables } from './configurations';
import { ModulesModule } from './modules';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: getEnvironment().envFilePath,
			skipProcessEnv: false,
			validate: validateEnvironmentVariables,
			isGlobal: true,
			cache: true,
			expandVariables: true,
		}),
		MongooseModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				uri: config.getOrThrow<string>('MONGO_DATABASE_URI'),
				serverSelectionTimeoutMS: 5000,
			}),
		}),
		CommonModule,
		ModulesModule,
	],
	providers: [],
})
export class AppModule {}
