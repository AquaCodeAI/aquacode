import { Logger, LogLevel } from '@nestjs/common';
import { EnvironmentEnum } from './environment.enums';

const logger = new Logger('EnvironmentConfig');

/**
 * Name of the environment variable that indicates the current Node environment.
 */
const NODE_ENV_VARIABLE_NAME = 'NODE_ENV';

/**
 * Shape of a Node environment configuration.
 */
type EnvironmentConfig = {
	/**
	 * Resolved environment name (e.g., development, production)
	 */
	environmentName: EnvironmentEnum;
	loggerLevels: LogLevel[];
	port: number;
	envFilePath: string[];
};

/**
 * Configuration for development environment.
 */
const developmentEnvironmentConfig: EnvironmentConfig = {
	environmentName: EnvironmentEnum.DEVELOPMENT,
	loggerLevels: ['error', 'warn', 'log', 'debug', 'verbose'],
	port: 3001,
	envFilePath: ['.env'],
};

/**
 * Configuration for production environment.
 */
const productionEnvironmentConfig: EnvironmentConfig = {
	environmentName: EnvironmentEnum.PRODUCTION,
	loggerLevels: ['error', 'warn'],
	port: 3001,
	envFilePath: ['.env'],
};

/**
 * Map of environment name to its configuration.
 */
const environmentConfig: Record<EnvironmentEnum, EnvironmentConfig> = {
	[EnvironmentEnum.DEVELOPMENT]: developmentEnvironmentConfig,
	[EnvironmentEnum.PRODUCTION]: productionEnvironmentConfig,
};

/**
 * Returns the current Node environment as an enum value.
 */
function getCurrentEnvironment(envValue?: string): EnvironmentEnum {
	const raw = (envValue ?? process.env[NODE_ENV_VARIABLE_NAME] ?? '')
		.toString()
		.trim()
		.toLowerCase();
	if (Object.values(EnvironmentEnum).includes(raw as EnvironmentEnum)) {
		return raw as EnvironmentEnum;
	}

	logger.warn(`Invalid NODE_ENV value: ${raw}. Defaulting to development.`);
	return EnvironmentEnum.DEVELOPMENT;
}

/**
 * Returns the configuration object for the current Node environment.
 */
export function getEnvironment(envValue?: string): EnvironmentConfig {
	const env = getCurrentEnvironment(envValue);
	return environmentConfig[env];
}
