import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@aquacode/common/exceptions';
import { ProjectDocument, ProjectsService } from '@aquacode/common/projects';
import { getProjectId } from '@aquacode/common/utils';
import { Auth } from 'better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { AQUA_COOKIE_SESSION_TOKEN } from '../constants';
import { OPTIONAL_AUTH_META_DATA, PUBLIC_AUTH_META_DATA } from '../decorators';

export type BetterAuthSession = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;
export type UserSession = BetterAuthSession & {
	user: BetterAuthSession['user'] & {
		connection?: string | null;
	};
	session: BetterAuthSession['session'] & {
		connection: string;
	};
};

export const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		@Inject(Reflector)
		private readonly reflector: Reflector,
		private readonly authService: AuthService,
		private readonly projectsService: ProjectsService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>();

		// Check if the route allows anonymous access
		if (this.isPublicRoute(context)) {
			return true;
		}

		// Get a project and xtract and validate a session
		const projectId = getProjectId(req.headers)!;
		const { result: project } = await this.projectsService.getProjectById(projectId);
		const session = await this.extractSession(req);
		this.attachSessionToRequest(req, session, project);

		// Check if the route has optional authentication
		if (this.isOptionalAuthRoute(context)) {
			return true; // Allow access regardless of session existence
		}

		// Require authentication for protected routes
		this.ensureAuthenticated(session);

		// Validate connection requirement for routes other than /v1/rest
		this.validateConnectionAccess(req, session);

		return true;
	}

	/**
	 * Checks if the route is marked as public (anonymous access allowed)
	 */
	private isPublicRoute(context: ExecutionContext): boolean {
		return (
			this.reflector.getAllAndOverride<boolean>(PUBLIC_AUTH_META_DATA, [
				context.getHandler(),
				context.getClass(),
			]) ?? false
		);
	}

	/**
	 * Checks if the route has optional authentication
	 */
	private isOptionalAuthRoute(context: ExecutionContext): boolean {
		return (
			this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_META_DATA, [
				context.getHandler(),
				context.getClass(),
			]) ?? false
		);
	}

	/**
	 * Extracts the session from the request using BetterAuth.
	 * Supports both Bearer token and cookie-based authentication.
	 */
	private async extractSession(req: Request): Promise<UserSession | null> {
		const headers = this.prepareAuthHeaders(req);
		return await this.authService.getAuthApi().getSession({
			headers,
			query: { disableCookieCache: true },
		});
	}

	/**
	 * Prepares authentication headers for BetterAuth.
	 * Converts Bearer token to cookie format if present.
	 */
	private prepareAuthHeaders(req: Request): Headers {
		const authHeader = req.get('authorization');
		if (!authHeader?.startsWith(BEARER_PREFIX)) {
			return fromNodeHeaders(req.headers);
		}

		const token = this.extractBearerToken(authHeader);
		const headers = fromNodeHeaders(req.headers);
		headers.set('cookie', `${AQUA_COOKIE_SESSION_TOKEN}=${token}`);

		return headers;
	}

	/**
	 * Extracts and decodes the token from a Bearer authorization header
	 */
	private extractBearerToken(authHeader: string): string {
		const rawToken = authHeader.substring(BEARER_PREFIX.length);
		return decodeURIComponent(rawToken); // Handles URL-encoded tokens (%2B, %3D, etc.)
	}

	/**
	 * Attaches session and user information to the request object
	 */
	private attachSessionToRequest(
		req: Request,
		session: UserSession | null,
		project: ProjectDocument,
	): void {
		const userConnection = session?.user?.connection;
		const sessionConnection = session?.session?.connection;
		const projectConnection = project.connection;

		const isConnectionValid =
			userConnection === projectConnection && sessionConnection === projectConnection;

		req.session = isConnectionValid ? session?.session : undefined;
		req.user = isConnectionValid ? session?.user : undefined;
	}

	/**
	 * Ensures that a valid session exists, throws UnauthorizedException otherwise
	 */
	private ensureAuthenticated(session: UserSession | null): void {
		if (!session) {
			throw new UnauthorizedException({
				errors: 'The access token is invalid or expired. Please log in again.',
			});
		}
	}

	/**
	 * Validates that the user has the required connection for accessing routes other than /v1/rest
	 */
	private validateConnectionAccess(req: Request, session: UserSession | null): void {
		const path = req.path;

		// Allow access to /v1/rest without connection validation
		if (path.startsWith('/v1/rest')) {
			return;
		}

		// Check if the user has the required connection
		const userConnection = session?.user?.connection;
		if (!userConnection || userConnection !== 'Aqua-Connection') {
			throw new UnauthorizedException({
				errors: 'Access denied. You need an Aqua-Connection to access this resource.',
			});
		}
	}
}
