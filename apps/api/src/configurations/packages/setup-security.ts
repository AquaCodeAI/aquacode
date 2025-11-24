import { INestApplication } from '@nestjs/common';
import { EnvironmentEnum } from '@aquacode/configurations';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import type { PackageSetup } from './packages-setup.registry';

/**
 * Apply security middlewares and headers.
 */
export const setupSecurity = (app: INestApplication): void => {
	const enableCsp = process.env.NODE_ENV === EnvironmentEnum.PRODUCTION;

	// Disable ETag and Last-Modified so Express/Nest won't generate validators
	const http = app.getHttpAdapter?.();
	const instance = http?.getInstance?.() ?? http ?? app;

	if (instance?.set) {
		instance.set('etag', false);
		instance.set('lastModified', false);
	}

	// Strip conditional request headers early so no handler can return 304
	app.use((req: Request, _res: Response, next: NextFunction) => {
		delete req.headers['if-none-match'];
		delete req.headers['if-modified-since'];
		next();
	});

	app.use(
		helmet({
			// Disable CSP by default to keep Swagger UI working out of the box
			contentSecurityPolicy: enableCsp ? undefined : false,
			// Disable COEP, which can block resources in dev and Swagger
			crossOriginEmbedderPolicy: false,
		}),
	);

	// Strong anti-cache headers to prevent storage anywhere
	app.use((_req: Request, res: Response, next: NextFunction) => {
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
		res.setHeader('Expires', '0');
		res.setHeader('Pragma', 'no-cache');
		next();
	});
};

/**
 * PackageSetup definition for the global validation layer.
 */
export const securityPackageSetup: PackageSetup = {
	name: 'Helmet & Security',
	setup: setupSecurity,
	enabled: true,
};
