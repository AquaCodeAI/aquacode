import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PackageSetup } from './packages-setup.registry';

/**
 * Configuration for class serializer interceptor
 */
export const classSerializerInterceptorConfig = {
	// Exclude undefined properties from the response
	excludeExtraneousValues: true,
	// Enable circular reference detection
	enableCircularCheck: true,
	// Enable implicit type conversion
	enableImplicitConversion: true,
	// Expose default values
	exposeDefaultValues: true,
};

/**
 * Apply serializer configuration to the application
 */
export const setupClassSerializer = (app: INestApplication): void => {
	app.useGlobalInterceptors(
		new ClassSerializerInterceptor(app.get(Reflector), classSerializerInterceptorConfig),
	);
};

/**
 * PackageSetup definition for the global validation layer.
 */
export const classSerializerPackageSetup: PackageSetup = {
	name: 'ClassSerializer',
	setup: setupClassSerializer,
	enabled: true,
};
