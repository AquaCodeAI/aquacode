import { Injectable, NestMiddleware } from '@nestjs/common';
import { BadRequestException } from '@aquacode/common/exceptions';
import { NextFunction, Request, Response } from 'express';
import { ProjectErrors } from '../errors';

export const AQUA_HEADER_PROJECT_ID = 'x-aqua-project-id';

@Injectable()
export class ProjectIdMiddleware implements NestMiddleware {
	use(req: Request, _res: Response, next: NextFunction) {
		if (req.method === 'OPTIONS') {
			next();
			return;
		}

		// Ignore /v1/initialization route
		if (req.path.startsWith('/v1/initialization')) {
			next();
			return;
		}

		// Check for project ID in the header
		const projectId = req.headers[AQUA_HEADER_PROJECT_ID] as string;
		if (!projectId) {
			throw new BadRequestException({ errors: ProjectErrors.PROJECT_ID_REQUIRED });
		}

		// Validate a project ID format (should start with 'prj_')
		if (!projectId.startsWith('prj_')) {
			throw new BadRequestException({ errors: ProjectErrors.PROJECT_ID_INVALID_FORMAT });
		}

		next();
	}
}
