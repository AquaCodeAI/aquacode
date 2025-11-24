import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { PackageSetup } from './packages-setup.registry';

/**
 * Configuration for the global validation pipe.
 */
export const validationPipeConfig = {
	// Remove non-whitelisted properties
	whitelist: false,
	// Throw an error if non-whitelisted properties are present instead of removing them
	forbidNonWhitelisted: false,
	// Transform payloads to be objects typed according to their DTO classes
	transform: true,
	transformOptions: {
		// Allow converting primitive types to their correct type based on the DTO definition
		enableImplicitConversion: true,
		// Ensure default values in DTO classes are applied
		exposeDefaultValues: true,
	},
};

/**
 * Apply global validation configuration to the application.
 */
export const setupValidation = (app: INestApplication): void => {
	app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
};

/**
 * PackageSetup definition for the global validation layer.
 */
export const validationPackageSetup: PackageSetup = {
	name: 'ValidationPipe',
	setup: setupValidation,
	enabled: true,
};
