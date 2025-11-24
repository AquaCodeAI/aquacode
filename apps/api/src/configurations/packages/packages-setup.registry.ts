import { INestApplication, Logger } from '@nestjs/common';
import { securityPackageSetup } from '@aquacode/configurations/packages/setup-security';
import { swaggerPackageSetup } from '@aquacode/configurations/packages/setup-swagger';
import { classSerializerPackageSetup } from './setup-class-serializer.config';
import { validationPackageSetup } from './setup-validation.config';

const logger = new Logger('PackageConfiguration');

export type PackageSetup = {
	name: string;
	setup: (app: INestApplication) => void | Promise<void>;
	enabled?: boolean;
};

/**
 * Central registry of all package setup steps.
 */
const packageSetups: PackageSetup[] = [
	classSerializerPackageSetup,
	validationPackageSetup,
	securityPackageSetup,
	swaggerPackageSetup,
];

/**
 * Execute all registered package setup steps.
 */
export const setupPackages = async (app: INestApplication): Promise<void> => {
	const allSetups = [...packageSetups];

	logger.log(`Starting packages setup (${allSetups.length} step(s))`);

	for (const step of allSetups) {
		if (step?.enabled === false) {
			logger.log(`Skipping disabled package setup: ${step.name}`);
			continue;
		}
		try {
			logger.log(`Configuring package: ${step.name} ...`);
			await step.setup(app);
			logger.log(`Configured package: ${step.name}`);
		} catch (error) {
			const err = error as Error;
			logger.error(`Failed configuring package: ${step.name} - ${err.message}`);
		}
	}

	logger.log('Packages setup complete');
};
