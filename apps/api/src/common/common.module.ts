import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { getEnvironment } from '@aquacode/configurations';
import { Auth, betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { Connection } from 'mongoose';
import { AccountsModule } from './accounts';
import { AiModule } from './ai';
import { AuthGuard, AuthModule, mongoTenantAdapter } from './auth';
import { CacheModule, CacheService } from './cache';
import { ConnectionsModule } from './connections';
import { BadRequestException } from './exceptions';
import { MessengerModule } from './messenger';
import { ProjectsModule } from './projects';
import { ServicesModule } from './services';
import { SessionsModule } from './sessions';
import { UsersModule } from './users';
import { generateULID } from './utils';

export function createAuthType(database: NonNullable<Connection['db']>) {
	return betterAuth({
		database: mongoTenantAdapter({ db: database }),
		basePath: '/v1/auth',
		disabledPaths: [
			'/get-session',
			'/sign-in/social',
			'/verify-email',
			'/send-verification-email',
			'/change-email',
			'/change-password',
			'/update-user',
			'/delete-user',
			'/reset-password/{token}',
			'/request-password-reset',
			'/list-sessions',
			'/revoke-session',
			'/revoke-sessions',
			'/revoke-other-sessions',
			'/link-social',
			'/list-accounts',
			'/delete-user/callback',
			'/unlink-account',
			'/refresh-token',
			'/get-access-token',
			'/account-info',
			'/ok',
			'/error',
		],
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
		},
		account: {
			additionalFields: {
				connection: {
					type: 'string',
					fieldName: 'connection',
					returned: true,
					required: true,
				},
			},
		},
		user: {
			additionalFields: {
				name: {
					type: 'string',
					fieldName: 'name',
					returned: true,
					required: false,
				},
				avatar: {
					type: 'string',
					fieldName: 'avatar',
					returned: true,
					required: false,
				},
				connection: {
					type: 'string',
					fieldName: 'connection',
					returned: true,
					required: true,
				},
			},
		},
		session: {
			additionalFields: {
				connection: {
					type: 'string',
					fieldName: 'connection',
					returned: true,
					required: true,
				},
			},
		},
		advanced: {
			cookiePrefix: 'aqua',
			database: {
				generateId: (options) => {
					const MODEL_PREFIXES = {
						user: 'user',
						account: 'acct',
						session: 'sess',
					};

					return generateULID(
						MODEL_PREFIXES[options.model as keyof typeof MODEL_PREFIXES] ||
							options.model,
					);
				},
			},
			ipAddress: {
				ipAddressHeaders: ['cf-connecting-ip'],
				disableIpTracking: false,
			},
		},
		databaseHooks: {
			account: {
				create: {
					before: async (data) => {
						const user = await database
							?.collection('users')
							.findOne({ _id: data.userId } as any, {
								projection: { connection: 1 },
							});
						if (user?.connection) {
							(data as any).connection = user.connection;
						}
					},
				},
			},
			session: {
				create: {
					before: async (data) => {
						const user = await database
							?.collection('users')
							.findOne({ _id: data.userId } as any, {
								projection: { connection: 1 },
							});
						if (user?.connection) {
							data.connection = user.connection;
						}
					},
				},
			},
		},
		hooks: {},
		plugins: [admin()],
		logger: {
			disabled: true,
			level: 'error',
		},
		telemetry: {
			enabled: false,
		},
	});
}

export type AuthType = ReturnType<typeof createAuthType>;

@Module({
	imports: [
		HttpModule.register({
			global: true,
		}),
		CacheModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				redisUri: config.getOrThrow<string>('REDIS_DATABASE_URI'),
			}),
			global: true,
		}),
		BullModule.forRootAsync({
			inject: [CacheService],
			useFactory: async (cacheService: CacheService) => ({
				connection: cacheService.getClient(),
				prefix: `${getEnvironment().envFilePath}:`,
			}),
		}),
		AuthModule.forRootAsync({
			inject: [getConnectionToken()],
			useFactory: (connection: Connection) => {
				const database = connection.db;
				if (!database)
					throw new BadRequestException({ errors: 'Database connection not found' });
				return createAuthType(database);
			},
		}),
		AccountsModule,
		AiModule,
		ConnectionsModule,
		ProjectsModule,
		MessengerModule,
		ServicesModule,
		SessionsModule,
		UsersModule,
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
	],
})
export class CommonModule {}
