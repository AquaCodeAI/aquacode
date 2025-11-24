import {
	type DynamicModule,
	MiddlewareConsumer,
	Module,
	NestModule,
	OnModuleInit,
	type Provider,
	RequestMethod,
} from '@nestjs/common';
import { DiscoveryModule, DiscoveryService, HttpAdapterHost, MetadataScanner } from '@nestjs/core';
import { createAuthMiddleware } from 'better-auth/api';
import { toNodeHandler } from 'better-auth/node';
import { AUTH_INSTANCE_KEY, AuthService } from './auth.service';
import { AFTER_HOOK_KEY, BEFORE_HOOK_KEY, HOOK_KEY } from './decorators';
import { AuthMiddleware } from './middlewares';

type HookType = 'before' | 'after';

interface HookMetadata {
	metadataKey: symbol;
	hookType: HookType;
}

interface AuthModuleOptions {
	imports?: any[];
	inject?: any[];
	useFactory: (...args: any[]) => Promise<unknown> | unknown;
}

const HOOK_METADATA: readonly HookMetadata[] = [
	{ metadataKey: BEFORE_HOOK_KEY, hookType: 'before' },
	{ metadataKey: AFTER_HOOK_KEY, hookType: 'after' },
] as const;

@Module({})
export class AuthModule implements NestModule, OnModuleInit {
	private static readonly DEFAULT_AUTH_BASE_PATH = '/v1/auth';

	constructor(
		private readonly adapterHost: HttpAdapterHost,
		private readonly authService: AuthService,
		private readonly discoveryService: DiscoveryService,
		private readonly metadataScanner: MetadataScanner,
	) {}

	/**
	 * Creates a dynamic module with asynchronous configuration.
	 */
	static forRootAsync(opts: AuthModuleOptions): DynamicModule {
		const authProvider: Provider = {
			provide: AUTH_INSTANCE_KEY,
			useFactory: async (...args: any[]) => opts.useFactory(...args),
			inject: opts.inject ?? [],
		};

		return {
			global: true,
			module: AuthModule,
			imports: [DiscoveryModule, ...(opts.imports ?? [])],
			providers: [authProvider, AuthService],
			exports: [AUTH_INSTANCE_KEY, AuthService],
		};
	}

	/**
	 * Initializes the module by discovering and registering authentication hooks.
	 *
	 * Scans all providers decorated with @AuthHooks() and registers their
	 * @OnBeforeAuth and @OnAfterAuth methods with the auth system.
	 */
	onModuleInit(): void {
		const auth = this.authService.getAuth();

		if (!this.hasHooksEnabled(auth)) {
			return;
		}

		const hookProviders = this.discoverHookProviders();

		for (const provider of hookProviders) {
			this.registerProviderHooks(provider);
		}
	}

	/**
	 * Configures middleware for the authentication system.
	 *
	 * - Applies body parsing middleware to all routes
	 * - Sets up the BetterAuth handler at the configured base path
	 */
	configure(consumer: MiddlewareConsumer): void {
		this.applyBodyParsingMiddleware(consumer);
		this.registerAuthHandler();
	}

	/**
	 * Checks if hooks are enabled in the auth configuration
	 */
	private hasHooksEnabled(auth: any): boolean {
		return !!auth.options.hooks;
	}

	/**
	 * Discovers all providers that are marked with @AuthHooks() decorator
	 */
	private discoverHookProviders() {
		return this.discoveryService
			.getProviders()
			.filter(({ metatype }) => metatype && Reflect.getMetadata(HOOK_KEY, metatype));
	}

	/**
	 * Registers all hook methods from a provider
	 */
	private registerProviderHooks(provider: any): void {
		const providerPrototype = Object.getPrototypeOf(provider.instance);
		const methods = this.metadataScanner.getAllMethodNames(providerPrototype);

		for (const methodName of methods) {
			const method = providerPrototype[methodName];
			this.setupMethodHooks(method, provider.instance);
		}
	}

	/**
	 * Applies body parsing middleware to all routes
	 */
	private applyBodyParsingMiddleware(consumer: MiddlewareConsumer): void {
		consumer.apply(AuthMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
	}

	/**
	 * Registers the BetterAuth handler with the Express application
	 */
	private registerAuthHandler(): void {
		const app = this.adapterHost.httpAdapter.getInstance();
		const authBasePath = this.normalizeBasePath(AuthModule.DEFAULT_AUTH_BASE_PATH);
		const authHandler = toNodeHandler(this.authService.getAuth());

		// Wrap handler to ensure it runs after NestJS middlewares
		app.use(authBasePath, async (req: any, res: any) => {
			await authHandler(req, res);
		});
	}

	/**
	 * Normalizes the base path by ensuring it starts with '/' and doesn't end with '/'
	 */
	private normalizeBasePath(path: string): string {
		const normalized = path.startsWith('/') ? path : `/${path}`;
		return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
	}

	/**
	 * Sets up hooks for a specific method by checking all hook metadata
	 */
	private setupMethodHooks(method: (...args: unknown[]) => unknown, instance: any): void {
		const auth = this.authService.getAuth();

		for (const { metadataKey, hookType } of HOOK_METADATA) {
			const hookPath = Reflect.getMetadata(metadataKey, method);

			if (!hookPath) {
				continue;
			}

			this.registerMethodHook(auth, hookType, hookPath, method, instance);
		}
	}

	/**
	 * Registers a hook method with the auth system.
	 * The hook path is used as-is, supporting paths like '/sign-in', '/sign-up', etc.
	 */
	private registerMethodHook(
		auth: any,
		hookType: HookType,
		hookPath: string,
		method: (...args: unknown[]) => unknown,
		instance: any,
	): void {
		if (!auth.options.hooks) {
			return;
		}

		this.attachHookToAuthInstance(auth, hookType, hookPath, method, instance);
	}

	/**
	 * Attaches a hook to the auth instance by wrapping the existing hook.
	 * Multiple hooks for the same path are chained and executed sequentially.
	 */
	private attachHookToAuthInstance(
		auth: any,
		hookType: HookType,
		path: string,
		method: (...args: unknown[]) => unknown,
		instance: any,
	): void {
		const existingHook = auth.options.hooks![hookType];

		auth.options.hooks![hookType] = createAuthMiddleware(async (ctx) => {
			// Execute the existing hook first (if any)
			if (existingHook) {
				await existingHook(ctx);
			}

			// Execute a new hook if a path matches
			if (path === ctx.path) {
				await method.apply(instance, [ctx]);
			}
		});
	}
}
