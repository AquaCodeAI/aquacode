import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SandboxMetaDataVercelDto {
	/**
	 * Vercel sandbox identifier
	 * @example 'sbx_9U7FZ1MKWAB82slpMdxZyHF1dHQ3'
	 */
	@ApiProperty({
		type: String,
		description: 'Identifier of the Vercel sandbox resource.',
		required: true,
		example: 'sbx_9U7FZ1MKWAB82slpMdxZyHF1dHQ3',
	})
	@Expose()
	@IsString({ message: 'sandboxId must be a string' })
	@IsNotEmpty({ message: 'sandboxId is required' })
	sandboxId: string;

	/**
	 * Allocated memory in MB
	 * @example 4096
	 */
	@ApiProperty({
		type: Number,
		description: 'Memory allocated to the sandbox (MB).',
		required: false,
		nullable: true,
		example: 4096,
	})
	@Expose()
	@IsOptional()
	@IsNumber({}, { message: 'memory must be a number' })
	memory?: number | null;

	/**
	 * Number of virtual CPUs
	 * @example 2
	 */
	@ApiProperty({
		type: Number,
		description: 'Number of vCPUs allocated to the sandbox.',
		required: false,
		nullable: true,
		example: 2,
	})
	@Expose()
	@IsOptional()
	@IsNumber({}, { message: 'vcpus must be a number' })
	vcpus?: number | null;

	/**
	 * Deployment region
	 * @example 'iad1'
	 */
	@ApiProperty({
		type: String,
		description: 'Region where the sandbox is running.',
		required: false,
		nullable: true,
		example: 'iad1',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'region must be a string' })
	region?: string | null;

	/**
	 * Runtime environment
	 * @example 'node22'
	 */
	@ApiProperty({
		type: String,
		description: 'Runtime used by the sandbox.',
		required: false,
		nullable: true,
		example: 'node22',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'runtime must be a string' })
	runtime?: string | null;

	/**
	 * Execution timeout in milliseconds
	 * @example 2700000
	 */
	@ApiProperty({
		type: Number,
		description: 'Timeout in milliseconds for the sandbox execution.',
		required: false,
		nullable: true,
		example: 2700000,
	})
	@Expose()
	@IsOptional()
	@IsNumber({}, { message: 'timeout must be a number' })
	timeout?: number | null;

	/**
	 * Request timestamp
	 * @example '2025-11-07T18:12:47.362Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Timestamp when the sandbox was requested from Vercel.',
		required: false,
		nullable: true,
		example: '2025-11-07T18:12:47.362Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'requestedAt must be a valid date' })
	requestedAt?: Date | null;

	/**
	 * Creation timestamp
	 * @example '2025-11-07T18:12:47.362Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Timestamp when the sandbox was created on Vercel.',
		required: false,
		nullable: true,
		example: '2025-11-07T18:12:47.362Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'createdAt must be a valid date' })
	createdAt?: Date | null;

	/**
	 * Current working directory
	 * @example '/vercel/sandbox'
	 */
	@ApiProperty({
		type: String,
		description: 'Current working directory for the sandbox.',
		required: false,
		nullable: true,
		example: '/vercel/sandbox',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'cwd must be a string' })
	cwd?: string | null;

	/**
	 * Last update timestamp
	 * @example '2025-11-07T18:12:47.362Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Timestamp when the sandbox metadata was last updated on Vercel.',
		required: false,
		nullable: true,
		example: '2025-11-07T18:12:47.362Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'updatedAt must be a valid date' })
	updatedAt?: Date | null;
}
