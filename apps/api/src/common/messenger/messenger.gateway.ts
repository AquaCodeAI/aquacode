import { WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import {
	AQUA_COOKIE_SESSION_TOKEN,
	AuthService,
	BEARER_PREFIX,
	UserSession,
} from '@aquacode/common/auth';
import { UnauthorizedException } from '@aquacode/common/exceptions';
import { ProjectDocument, ProjectsService } from '@aquacode/common/projects';
import { fromNodeHeaders } from 'better-auth/node';
import { Server, Socket } from 'socket.io';
import { MessengerService } from './messenger.service';

@WebSocketGateway({ namespace: '/messenger' })
export class MessengerGateway {
	@WebSocketServer()
	private server: Server;

	constructor(
		private readonly projectsService: ProjectsService,
		private readonly authService: AuthService,
		private readonly messengerService: MessengerService,
	) {}

	afterInit(): void {
		this.messengerService.attachServer(this.server);
	}

	async handleConnection(client: Socket): Promise<void> {
		try {
			// Get a project and xtract and validate a session
			const projectId = client.handshake.auth?.projectId;
			if (!projectId)
				throw new WsException('Project ID is missing in the handshake headers.');
			const { result: project } = await this.projectsService.getProjectById(projectId);
			const session = await this.extractSession(client);
			this.attachSessionToRequest(client, session, project);

			// Require authentication for protected routes
			this.ensureAuthenticated(session);

			this.validateConnectionAccess(session);
		} catch (e) {
			client.emit('messenger', { errors: ['Authentication failed'] });
			client.disconnect(true);
		}
	}

	/**
	 * Extracts the session from the request using BetterAuth.
	 */
	private async extractSession(client: Socket): Promise<UserSession | null> {
		const headers = this.prepareAuthHeaders(client);
		return await this.authService.getAuthApi().getSession({
			headers,
			query: { disableCookieCache: true },
		});
	}

	/**
	 * Prepares authentication headers for BetterAuth.
	 * Converts Bearer token to cookie format if present.
	 */
	private prepareAuthHeaders(client: Socket): Headers {
		const authHeader = client.handshake.auth?.token;
		if (!authHeader?.startsWith(BEARER_PREFIX)) {
			return fromNodeHeaders(client.handshake.headers);
		}

		const token = this.extractBearerToken(authHeader);
		const headers = fromNodeHeaders(client.handshake.headers);
		headers.set('cookie', `${AQUA_COOKIE_SESSION_TOKEN}=${token}`);

		return headers;
	}

	/**
	 * Extracts and decodes the token from a Bearer authorization header
	 */
	private extractBearerToken(authHeader: string): string {
		const rawToken = authHeader.substring(BEARER_PREFIX.length);
		return decodeURIComponent(rawToken);
	}

	/**
	 * Attaches session and user information to the request object
	 */
	private attachSessionToRequest(
		client: Socket,
		session: UserSession | null,
		project: ProjectDocument,
	): void {
		const userConnection = session?.user?.connection;
		const sessionConnection = session?.session?.connection;
		const projectConnection = project.connection;

		const isConnectionValid =
			userConnection === projectConnection && sessionConnection === projectConnection;

		if (isConnectionValid && session) {
			client.data.session = session.session;
			client.data.user = session.user;
		} else {
			client.data.session = undefined;
			client.data.user = undefined;
		}
	}

	/**
	 * Ensures that a valid session exists, throws UnauthorizedException otherwise
	 */
	private ensureAuthenticated(session: UserSession | null): void {
		if (!session) {
			throw new WsException('The access token is invalid or expired. Please log in again.');
		}
	}

	/**
	 * Validates that the user has the required connection for accessing messenger resources
	 */
	private validateConnectionAccess(session: UserSession | null): void {
		// Check if the user has the required connection
		const userConnection = session?.user?.connection;
		if (!userConnection || userConnection !== 'Aqua-Connection') {
			throw new UnauthorizedException({
				errors: 'Access denied. You need an Aqua-Connection to access this resource.',
			});
		}
	}
}
