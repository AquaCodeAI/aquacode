import { Injectable } from '@nestjs/common';
import {
	AQUA_COOKIE_SESSION_TOKEN,
	AuthHookContext,
	getProjectId,
	NotFoundException,
	ProjectDocument,
	ProjectErrors,
	ProjectsService,
} from '@aquacode/common';
import { APIError } from 'better-auth';
import { SignInErrors } from './errors';

/* eslint-disable */

@Injectable()
export class SignInService {
	constructor(private readonly projectsService: ProjectsService) {}

	async handleBeforeSignIn(ctx: AuthHookContext) {
		const userEmail = ctx.body?.email;
		if (!userEmail) {
			throw new APIError('BAD_REQUEST', {
				success: false,
				errors: [SignInErrors.EMAIL_IS_REQUIRED],
				messages: [],
			});
		}

		const projectId = getProjectId(ctx.headers)!;
		let project: ProjectDocument;
		try {
			const { result: projectResult } = await this.projectsService.getProjectById(projectId);
			project = projectResult;
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
				errors: [SignInErrors.SIGN_IN_FAILED],
				messages: [],
			});
		}
		const connection = project.connection;

		const originalFindUserByEmail = ctx.context.internalAdapter.findUserByEmail;
		ctx.context.internalAdapter.findUserByEmail = async (email, options2) => {
			const originalFindOne = ctx.context.adapter.findOne;
			ctx.context.adapter.findOne = async ({ model, where, select }) => {
				if (model === 'users' || model === 'user') {
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
				return await originalFindUserByEmail(email, options2);
			} finally {
				ctx.context.adapter.findOne = originalFindOne;
			}
		};
	}

	async handleAfterSignIn(ctx: AuthHookContext) {
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
