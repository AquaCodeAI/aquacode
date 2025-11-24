import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
	IsEmail,
	IsIn,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
	Matches,
	validateSync,
} from 'class-validator';
import { EnvironmentEnum } from './environment.enums';

/**
 * Validation schema for all environment variables.
 */
export class EnvironmentVariablesSchema {
	// Node Environment
	@IsString()
	@IsNotEmpty()
	@IsIn(Object.values(EnvironmentEnum))
	NODE_ENV!: EnvironmentEnum;

	// Database Configuration
	@IsString()
	@IsNotEmpty()
	@Matches(/^mongodb(\+srv)?:\/\/.+/, {
		message: 'MONGO_DATABASE_URI must be a valid MongoDB connection string',
	})
	MONGO_DATABASE_URI!: string;

	@IsString()
	@IsNotEmpty()
	@Matches(/^redis(s)?:\/\/.+/, {
		message: 'REDIS_DATABASE_URI must be a valid Redis connection string',
	})
	REDIS_DATABASE_URI!: string;

	// Better Auth Environment
	@IsString()
	@IsNotEmpty()
	BETTER_AUTH_SECRET!: string;

	// LLM Configuration
	@IsString()
	@IsNotEmpty()
	ANTHROPIC_API_KEY!: string;

	// Vercel Configuration
	@IsString()
	@IsNotEmpty()
	VERCEL_TOKEN!: string;

	@IsString()
	@IsNotEmpty()
	VERCEL_TEAM_ID!: string;

	// Aqua Code
	@IsString()
	@IsUrl()
	AQUA_DOMAIN: string;

	@IsEmail()
	@IsOptional()
	AQUA_STUDIO_DEFAULT_EMAIL?: string;

	@IsString()
	@IsNotEmpty()
	@IsOptional()
	AQUA_STUDIO_DEFAULT_PASSWORD?: string;
}

export function transformEnvironmentVariables(
	config: Record<string, unknown>,
): EnvironmentVariablesSchema {
	return plainToInstance(EnvironmentVariablesSchema, config, {
		enableImplicitConversion: true,
		exposeDefaultValues: true,
	});
}

/**
 * Validates all environment variables and returns a plain object preserving original keys.
 */
export function validateEnvironmentVariables(
	variables: Record<string, unknown>,
): Record<string, unknown> {
	const instance = transformEnvironmentVariables(variables);

	const errors = validateSync(instance, { skipMissingProperties: false });
	if (errors.length > 0) {
		throw new Error(
			`Environment validation failed: ${errors
				.map((err) => JSON.stringify(err.constraints))
				.join(', ')}`,
		);
	}

	return instanceToPlain(instance) as Record<string, unknown>;
}
