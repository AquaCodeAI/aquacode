import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { SandboxStatus } from '../enums';
import { SandboxMetaDataDto } from './sandbox-meta-data.dto';

export class SandboxDto {
	/**
	 * Unique sandbox identifier
	 * @example 'sbx_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique sandbox identifier in ULID format.',
		required: true,
		example: 'sbx_01JV5V3CVXQNYFM2NHCRBM7KQH',
		pattern: '^sbx_[0-9A-Za-z]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'Sandbox ID must be a string' })
	@IsNotEmpty({ message: 'Sandbox ID is required' })
	@MinLength(30, { message: 'Sandbox ID must be exactly 30 characters long' })
	@MaxLength(30, { message: 'Sandbox ID must be exactly 30 characters long' })
	@Matches(/^sbx_[0-9A-Za-z]{26}$/, {
		message: 'Sandbox ID must be in ULID format: "sbx_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * Sandbox domain
	 * @example 'ai-recipe-finder-preview.vercel.app'
	 */
	@ApiProperty({
		type: String,
		description: 'Domain where the sandbox is accessible.',
		required: false,
		example: 'ai-recipe-finder-preview.vercel.app',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Domain must be a string' })
	domain?: string;

	/**
	 * Associated project identifier
	 * @example 'prj_01KABWJ6YJD201E0SS4TVBP7HD'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique project identifier in ULID format with prj_ prefix.',
		required: true,
		example: 'prj_01KABWJ6YJD201E0SS4TVBP7HD',
		pattern: '^prj_[0-9A-Za-z]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'Project ID must be a string' })
	@IsNotEmpty({ message: 'Project ID is required' })
	@MinLength(30, { message: 'Project ID must be exactly 30 characters long' })
	@MaxLength(30, { message: 'Project ID must be exactly 30 characters long' })
	@Matches(/^prj_[0-9A-Za-z]{26}$/, {
		message: 'Project ID must be in ULID format: "prj_" followed by 26 alphanumeric characters',
	})
	projectId: string;

	/**
	 * Sandbox request timestamp
	 * @example '2026-01-15T10:30:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Timestamp when the sandbox was requested.',
		required: false,
		example: '2026-01-15T10:30:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'Requested at must be a valid date' })
	requestedAt?: Date;

	/**
	 * Current sandbox status
	 * @example 'INITIALIZED'
	 */
	@ApiProperty({
		enum: SandboxStatus,
		description: 'Current status of the sandbox: INITIALIZING, INITIALIZED, or FAILED.',
		required: true,
		example: SandboxStatus.INITIALIZED,
	})
	@Expose()
	@IsEnum(SandboxStatus, {
		message: 'Status must be INITIALIZING, INITIALIZED, or FAILED',
	})
	@IsNotEmpty({ message: 'Status is required' })
	status: SandboxStatus;

	/**
	 * Last activity timestamp
	 * @example '2026-01-15T14:45:30.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Timestamp of the last activity in the sandbox.',
		required: false,
		example: '2026-01-15T14:45:30.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'Last activity at must be a valid date' })
	lastActivityAt?: Date;

	/**
	 * Sandbox provider metadata
	 * @example { vercel: { sandboxId: 'sbx_9U7FZ1MKWAB82slpMdxZyHF1dHQ3' } }
	 */
	@ApiProperty({
		description: 'Provider-specific sandbox metadata (e.g., Vercel).',
		required: false,
		type: () => SandboxMetaDataDto,
		nullable: true,
	})
	@Expose()
	@Type(() => SandboxMetaDataDto)
	@ValidateNested()
	@IsOptional()
	sandboxMetaData?: SandboxMetaDataDto;

	/**
	 * Sandbox creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Sandbox creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsNotEmpty({ message: 'Created at is required' })
	createdAt?: Date;

	/**
	 * Sandbox last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Sandbox last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsNotEmpty({ message: 'Updated at is required' })
	updatedAt?: Date;
}
