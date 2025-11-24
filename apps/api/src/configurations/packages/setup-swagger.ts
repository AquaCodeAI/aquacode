import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { EnvironmentEnum } from '@aquacode/configurations/environment';
import type { PackageSetup } from './packages-setup.registry';

/**
 * Configuration for Swagger API documentation
 */
const swaggerConfig: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
	.setTitle('AquaCode Bali')
	.setDescription(
		`
AquaCode Bali is a powerful platform for creating, managing, and deploying apps with AI. This API provides comprehensive endpoints for app lifecycle management, deployment orchestration, and intelligent code generation.

## Support
For issues or questions, contact the AquaCode team.`,
	)
	.setVersion('1.0')
	.addBearerAuth()
	.setContact('AquaCode Support', 'https://aquacode.ai', 'support@aquacode.ai')
	.setLicense('Licence Apache 2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
	.build();

/**
 * Apply Swagger configuration to the application
 */
export const setupSwagger = (app: INestApplication): void => {
	const enableSwagger = process.env.NODE_ENV === EnvironmentEnum.DEVELOPMENT;

	// If Swagger is disabled, return early
	if (!enableSwagger) {
		return;
	}

	// Create the Swagger document
	const document = SwaggerModule.createDocument(app, swaggerConfig);

	// Set up the Swagger UI at the /docs endpoint
	SwaggerModule.setup('docs', app, document, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});
};

/**
 * PackageSetup definition for the global validation layer.
 */
export const swaggerPackageSetup: PackageSetup = {
	name: 'Swagger',
	setup: setupSwagger,
	enabled: true,
};
