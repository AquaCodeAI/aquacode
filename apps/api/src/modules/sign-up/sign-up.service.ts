import { Injectable } from '@nestjs/common';
import {
	AQUA_COOKIE_SESSION_TOKEN,
	AuthHookContext,
	generateAvatarImage,
	getProjectId,
	NotFoundException,
	ProjectDocument,
	ProjectErrors,
	ProjectsService,
	UsersService,
} from '@aquacode/common';
import { APIError } from 'better-auth';
import { SignUpErrors } from './errors';

/* eslint-disable */

@Injectable()
export class SignUpService {
	constructor(
		private readonly projectsService: ProjectsService,
		private readonly userService: UsersService,
	) {}

	async handleBeforeSignUp(ctx: AuthHookContext) {
		const userEmail = ctx.body?.email;
		if (!userEmail) {
			throw new APIError('BAD_REQUEST', {
				success: false,
				errors: [SignUpErrors.EMAIL_IS_REQUIRED],
				messages: [],
			});
		}

		const projectId = getProjectId(ctx.headers)!;
		let project: ProjectDocument;
		try {
			const projectResult = await this.projectsService.getProjectById(projectId);
			project = projectResult.result;
		} catch (e) {
			if (e instanceof NotFoundException) {
				throw new APIError('NOT_FOUND', {
					success: false,
					errors: [ProjectErrors.PROJECT_NOT_FOUND],
					messages: [],
				});
			}
			throw new APIError('INTERNAL_SERVER_ERROR', {
				success: false,
				errors: [SignUpErrors.SIGN_UP_FAILED],
				messages: [],
			});
		}
		const connection = project.connection;

		// Add connection to the body so it gets included when creating the user
		if (ctx.body.connection) {
			if (ctx.body.connection !== connection) {
				throw new APIError('BAD_REQUEST', {
					success: false,
					errors: [SignUpErrors.INVALID_CONNECTION],
					messages: [],
				});
			}
		} else {
			ctx.body.connection = connection;
		}

		// Generate name and avatar for the new user
		const name = userEmail.split('@')[0];
		const avatar = generateAvatarImage(name);

		// Add name and avatar to the body so Better Auth includes them when creating the user
		ctx.body.name = name;
		ctx.body.avatar = avatar;

		const { result: emailExists } = await this.userService.existUserByEmailAndConnection(
			userEmail,
			connection,
		);
		if (emailExists) {
			throw new APIError('CONFLICT', {
				success: false,
				errors: [SignUpErrors.EMAIL_ALREADY_EXISTS],
				messages: [],
			});
		}

		const originalFindUserByEmail = ctx.context.internalAdapter.findUserByEmail;
		ctx.context.internalAdapter.findUserByEmail = async (email, options2) => {
			// Temporarily override the adapter's findOne to add connection
			const originalFindOne = ctx.context.adapter.findOne;
			ctx.context.adapter.findOne = async ({ model, where, select }) => {
				if (model === 'users' || model === 'user') {
					// Add connection to the where conditions
					const modifiedWhere = [
						...where,
						{
							value: connection,
							field: 'connection',
						},
					];
					return await originalFindOne({ model, where: modifiedWhere, select });
				}
				return await originalFindOne({ model, where, select });
			};

			try {
				// Call the original findUserByEmail which will use our modified findOne
				return await originalFindUserByEmail(email, options2);
			} finally {
				// Restore the original findOne method
				ctx.context.adapter.findOne = originalFindOne;
			}
		};

		return;
	}

	async handleAfterSignUp(ctx: AuthHookContext) {
		if (ctx.context.returned instanceof APIError) {
			throw new APIError(ctx.context.returned.status, {
				success: false,
				errors: [ctx.context.returned.message],
				messages: [],
			});
		}

		const contextReturned = ctx.context.returned || {};
		const responseHeaders = ctx.context.responseHeaders?.getSetCookie();
		const firmSessionToken =
			responseHeaders
				?.find((c) => c.includes(`${AQUA_COOKIE_SESSION_TOKEN}=`))
				?.split(';')[0]
				?.split('=')[1] ?? '';

		ctx.context.returned = { ...contextReturned, token: decodeURI(firmSessionToken) };
		ctx.context.responseHeaders = new Headers();
	}
}
