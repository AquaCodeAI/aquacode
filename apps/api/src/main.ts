import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter, ProjectIdMiddleware } from './common';
import { getEnvironment, setupPackages } from './configurations';

const logger = new Logger('Main');

async function bootstrap() {
	// Get the current environment configuration
	const config = getEnvironment();

	// Create the NestJS application
	const app = await NestFactory.create(AppModule, {
		logger: config.loggerLevels,
		bodyParser: false,
	});

	// Setup packages configurations
	await setupPackages(app);

	// Configure WebSocket adapter
	app.useWebSocketAdapter(new IoAdapter(app));

	app.enableCors({
		origin: (
			origin: string | undefined,
			callback: (err: Error | null, allowOrigin?: string | boolean) => void,
		) => {
			// Allow requests without an origin
			if (!origin) {
				return callback(null, true);
			}

			// Allow all localhost origins on any port for development
			if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
				return callback(null, origin);
			}

			// Allow the requesting origin for any other case
			callback(null, origin);
		},
		credentials: true,
		methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'X-Aqua-Project-Id',
			'X-Aqua-Deployment-Id',
		],
	});

	// Apply Project ID middleware to validate and extract project IDs from request headers
	const projectIdMiddleware = new ProjectIdMiddleware();
	app.use((req: Request, res: Response, next: NextFunction) =>
		projectIdMiddleware.use(req, res, next),
	);

	// Register global exception filter to standardize error responses across the application
	app.useGlobalFilters(new HttpExceptionFilter());

	// Start the server with optimized settings
	await app.listen(process.env.PORT || config.port);
}

bootstrap().catch((error: Error) => {
	logger.error(`Failed to start AquaCode application: ${error.message}`, error.stack);
	process.exit(1);
});
