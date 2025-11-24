import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
	IsDate,
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { DeploymentConnectionSchemaItemDto } from './deployment-connection-schema-item.dto';

export class DeploymentConnectionDto {
	/**
	 * Unique deployment policy identifier
	 * @example 'depc_01KA21TE9W906DPACGTZ494TD2'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique deployment connection identifier in ULID format.',
		required: true,
		example: 'depc_01KA21TE9W906DPACGTZ494TD2',
		pattern: '^depc_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@IsString({ message: 'ID must be a string' })
	@IsNotEmpty({ message: 'ID is required' })
	@MinLength(31, { message: 'Deployment connection ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'Deployment connection ID must be exactly 31 characters long' })
	@Matches(/^depc_[0-9A-Za-z]{26}$/, {
		message:
			'Deployment connection ID must be in ULID format: "depc_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * Connection's name
	 * @example 'Aqua-Connection'
	 */
	@ApiProperty({
		type: String,
		description: "Connection's name. Max characters 50.",
		required: true,
		example: 'Aqua-Connection',
		default: 'Default-Connection',
		minLength: 1,
		maxLength: 50,
	})
	@Expose()
	@IsString({ message: 'Name must be a string' })
	@IsNotEmpty({ message: 'Name is required' })
	@MinLength(1, { message: 'Name must be at least 1 character' })
	@MaxLength(50, { message: 'Name must not exceed 50 characters' })
	name: string;

	/**
	 * Connection schemas
	 */
	@ApiProperty({
		type: () => [DeploymentConnectionSchemaItemDto],
		required: true,
		description: 'Connection schemas configuration',
	})
	@Expose()
	@Type(() => DeploymentConnectionSchemaItemDto)
	@ValidateNested({ each: true })
	schemas?: DeploymentConnectionSchemaItemDto[];

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
	 * Connection creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Connection creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsNotEmpty({ message: 'Created at is required' })
	createdAt?: Date;

	/**
	 * Connection last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Connection last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsNotEmpty({ message: 'Updated at is required' })
	updatedAt?: Date;
}
