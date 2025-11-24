import {
	createParamDecorator,
	CustomDecorator,
	type ExecutionContext,
	SetMetadata,
} from '@nestjs/common';
import { createAuthMiddleware } from 'better-auth/api';

export const PUBLIC_AUTH_META_DATA = 'PUBLIC';
export const OPTIONAL_AUTH_META_DATA = 'OPTIONAL';

export const BEFORE_HOOK_KEY = Symbol('BEFORE_HOOK');
export const AFTER_HOOK_KEY = Symbol('AFTER_HOOK');
export const HOOK_KEY = Symbol('HOOK');

/**
 * Marks a route or controller as public (does not require authentication).
 * Routes decorated with @PublicAuth will bypass the AuthGuard and allow access without a session.
 *
 * @example
 * ```TypeScript
 * @Controller('public')
 * export class PublicController {
 *   @Get('info')
 *   @PublicAuth()
 *   getPublicInfo() {
 *     return { message: 'This is public' };
 *   }
 * }
 * ```
 */
export const PublicAuth = () => SetMetadata(PUBLIC_AUTH_META_DATA, true);

/**
 * Marks a route or controller with optional authentication.
 * The AuthGuard will allow access even if no session exists but will populate
 * the session if a valid one is present.
 *
 * Useful for routes that can work with or without authentication, providing
 * different behavior based on the user's authentication state.
 *
 * @example
 * ```typescript
 * @Controller('content')
 * export class ContentController {
 *   @Get('list')
 *   @OptionalAuth()
 *   getContent(@CurrentSession() session?: Session) {
 *     // Show personalized content if session exists, generic content otherwise
 *     returns session ? this.getPersonalizedContent(session): this.getGenericContent();
 *   }
 * }
 * ```
 */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_META_DATA, true);

/**
 * Parameter decorator to inject the current user session into a route handler.
 *
 * The session object contains user authentication information and is populated
 * by the AuthGuard middleware. Returns undefined if no session exists.
 *
 * @remarks
 * Requires Express type augmentation for `req.session` to work with TypeScript.
 *
 * @example
 * ```typescript
 * @Controller('profile')
 * export class ProfileController {
 *   @Get()
 *   getProfile(@CurrentSession() session: Session) {
 *     return { userId: session.user.id, email: session.user.email };
 *   }
 * }
 * ```
 */
export const CurrentUserSession = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
	const req = ctx.switchToHttp().getRequest();
	return { user: req?.user, session: req?.session };
});

/**
 * Represents the context object passed to hooks.
 * This type is derived from the parameters of the createAuthMiddleware function.
 */
export type AuthHookContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

/**
 * Method decorator that registers a hook to be executed before a specific auth route is processed.
 *
 * The decorated method will be called before the authentication middleware processes the request,
 * allowing you to modify the request, validate data, or perform custom logic.
 *
 * @param path - The authentication route path that triggers this hook (must start with '/').
 *               Example: '/sign-in', '/sign-up', '/sign-out'
 *
 * @remarks
 * - The class containing this decorator must be decorated with @AuthHooks()
 * - The method signature should accept an AuthHookContext parameter
 * - Multiple before hooks can be registered for the same path
 *
 * @example
 * ```TypeScript
 * @AuthHooks()
 * @Injectable()
 * export class AuthHookService {
 *   @OnBeforeAuth('/sign-in')
 *   async beforeSignIn(context: AuthHookContext) {
 *     console.log('User attempting to sign in');
 *     // Perform validation, rate limiting, etc.
 *   }
 * }
 * ```
 */
export const OnBeforeAuth = (path: `/${string}`): CustomDecorator<symbol> =>
	SetMetadata(BEFORE_HOOK_KEY, path);

/**
 * Method decorator that registers a hook to be executed after a specific auth route is processed.
 *
 * The decorated method will be called after the authentication middleware completes processing,
 * allowing you to perform post-authentication tasks like logging, analytics, or notifications.
 *
 * @param path - The authentication route path that triggers this hook (must start with '/').
 *               Example: '/sign-in', '/sign-up', '/sign-out'
 *
 * @remarks
 * - The class containing this decorator must be decorated with @AuthHooks()
 * - The method signature should accept an AuthHookContext parameter
 * - Multiple after hooks can be registered for the same path
 *
 * @example
 * ```TypeScript
 * @AuthHooks()
 * @Injectable()
 * export class AuthHookService {
 *   @OnAfterAuth('/sign-in')
 *   async afterSignIn(context: AuthHookContext) {
 *     console.log('User successfully signed in');
 *     // Send welcome email, log analytics, etc.
 *   }
 * }
 * ```
 */
export const OnAfterAuth = (path: `/${string}`): CustomDecorator<symbol> =>
	SetMetadata(AFTER_HOOK_KEY, path);

/**
 * Class decorator that marks a provider as containing authentication hook methods.
 *
 * This decorator must be applied to any class that uses @OnBeforeAuth or @OnAfterAuth
 * decorators. It registers the class with the authentication system so hooks can be
 * properly discovered and executed.
 *
 * @remarks
 * - The decorated class should be an Injectable provider
 * - Register the class in the appropriate module's provider array
 * - The class can contain multiple hook methods for different auth routes
 *
 * @example
 * ```TypeScript
 * @AuthHooks()
 * @Injectable()
 * export class AuthHookService {
 *   @OnBeforeAuth('/sign-in')
 *   async beforeSignIn(context: AuthHookContext) {
 *     // Hook logic
 *   }
 *
 *   @OnAfterAuth('/sign-in')
 *   async afterSignIn(context: AuthHookContext) {
 *     // Hook logic
 *   }
 *
 *   @OnAfterAuth('/sign-up')
 *   async afterSignUp(context: AuthHookContext) {
 *     // Hook logic
 *   }
 * }
 * ```
 */
export const AuthHooks = (): ClassDecorator => SetMetadata(HOOK_KEY, true);
