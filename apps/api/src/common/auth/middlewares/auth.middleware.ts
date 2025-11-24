import { Injectable, NestMiddleware } from '@nestjs/common';
import { json, NextFunction, Request, Response, urlencoded } from 'express';

/**
 * Middleware that conditionally applies body parsing based on the request path.
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
	private static readonly AUTH_PATH_PREFIX = '/v1/auth';

	use(req: Request, res: Response, next: NextFunction): void {
		if (this.shouldSkipBodyParsing(req)) {
			next();
			return;
		}

		this.applyBodyParsers(req, res, next);
	}

	/**
	 * Determines if body parsing should be skipped for the current request.
	 *
	 * @param req - The Express request object
	 * @returns true if the request is for auth.
	 */
	private shouldSkipBodyParsing(req: Request): boolean {
		return this.isAuthRequest(req);
	}

	/**
	 * Checks if the request is targeting an authentication endpoint
	 */
	private isAuthRequest(req: Request): boolean {
		return req.path.startsWith(AuthMiddleware.AUTH_PATH_PREFIX);
	}

	/**
	 * Applies JSON and URL-encoded body parsers to the request.
	 *
	 * First applies JSON parser, then URL-encoded parser on success.
	 * Any parsing errors are passed to the next error handler.
	 */
	private applyBodyParsers(req: Request, res: Response, next: NextFunction): void {
		json()(req, res, (err) => {
			if (err) {
				next(err);
				return;
			}

			urlencoded({ extended: true })(req, res, next);
		});
	}
}
