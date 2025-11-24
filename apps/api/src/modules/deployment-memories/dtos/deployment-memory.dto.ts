import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
	IsArray,
	IsDate,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { DeploymentMemoryLongTermDto } from './deployment-memory-long-term.dto';

export class DeploymentMemoryDto {
	/**
	 * Unique deployment memory identifier
	 * @example 'depm_01KA21TE9W906DPACGTZ494TD2'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique deployment memory identifier in ULID format.',
		required: true,
		example: 'depm_01KA21TE9W906DPACGTZ494TD2',
		pattern: '^depm_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@IsString({ message: 'ID must be a string' })
	@IsNotEmpty({ message: 'ID is required' })
	@MinLength(31, { message: 'Deployment memory ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'Deployment memory ID must be exactly 31 characters long' })
	@Matches(/^depm_[0-9A-Za-z]{26}$/, {
		message:
			'Deployment memory ID must be in ULID format: "depm_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * Long-term memory entries
	 */
	@ApiProperty({
		type: () => [DeploymentMemoryLongTermDto],
		description: 'List of long-term memory entries.',
		required: true,
		isArray: true,
		default: [],
	})
	@Expose()
	@IsArray({ message: 'longTerm must be an array' })
	@ValidateNested({ each: true })
	@Type(() => DeploymentMemoryLongTermDto)
	longTerm: DeploymentMemoryLongTermDto[];

	/**
	 * Associated project identifier
	 * @example 'prj_01K9FRAGHJ0J7VJPCPYVVC1EYS'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique project identifier in ULID format with prj_ prefix.',
		required: true,
		example: 'prj_01K9FRAGHJ0J7VJPCPYVVC1EYS',
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
	 * Associated deployment identifier
	 * @example 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique deployment identifier in ULID format.',
		required: true,
		example: 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH',
		pattern: '^dpl_[0-9A-Za-z]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'Deployment ID must be a string' })
	@IsNotEmpty({ message: 'Deployment ID is required' })
	@MinLength(30, { message: 'Deployment ID must be exactly 30 characters long' })
	@MaxLength(30, { message: 'Deployment ID must be exactly 30 characters long' })
	@Matches(/^dpl_[0-9A-Za-z]{26}$/, {
		message:
			'Deployment ID must be in ULID format: "dpl_" followed by 26 alphanumeric characters',
	})
	deploymentId: string;

	/**
	 * Memory creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Deployment memory creation timestamp.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'createdAt must be a valid date' })
	@IsOptional()
	createdAt?: Date;

	/**
	 * Memory update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Deployment memory update timestamp.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'updatedAt must be a valid date' })
	@IsOptional()
	updatedAt?: Date;
}
