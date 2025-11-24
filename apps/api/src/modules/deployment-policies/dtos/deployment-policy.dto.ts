import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
	IsDate,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';

export class DeploymentPolicyDto {
	/**
	 * Unique deployment policy identifier
	 * @example 'depp_01KA21TE9W906DPACGTZ494TD2'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique deployment policy identifier in ULID format.',
		required: true,
		example: 'depp_01KA21TE9W906DPACGTZ494TD2',
		pattern: '^depp_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@IsString({ message: 'ID must be a string' })
	@IsNotEmpty({ message: 'ID is required' })
	@MinLength(31, { message: 'Deployment policy ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'Deployment policy ID must be exactly 31 characters long' })
	@Matches(/^depp_[0-9A-Za-z]{26}$/, {
		message:
			'Deployment policy ID must be in ULID format: "depp_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * Target schema name
	 * @example 'ShoppingItem'
	 */
	@ApiProperty({
		type: String,
		description: 'Target schema name (e.g., collection/table).',
		required: true,
		example: 'ShoppingItem',
	})
	@Expose()
	@IsString({ message: 'Schema must be a string' })
	@IsNotEmpty({ message: 'Schema is required' })
	schemaName: string;

	/**
	 * Human-readable policy name
	 * @example 'User cannot change owner'
	 */
	@ApiProperty({
		type: String,
		description: 'Human-readable policy name.',
		required: true,
		example: 'User cannot change owner',
		minLength: 1,
		maxLength: 200,
	})
	@Expose()
	@IsString({ message: 'Name must be a string' })
	@IsNotEmpty({ message: 'Name is required' })
	@MinLength(1, { message: 'Name must be at least 1 character long' })
	@MaxLength(200, { message: 'Name must not exceed 200 characters' })
	policyName: string;

	/**
	 * Policy operation type
	 * @example 'UPDATE'
	 */
	@ApiProperty({
		type: String,
		description:
			'Operation name. Can be a single operation (e.g., UPDATE) or a composite string (e.g., "FIND - GET - UPDATE - DELETE")',
		required: true,
		example: 'UPDATE',
	})
	@Expose()
	@IsString({ message: 'Operation must be a string' })
	@IsNotEmpty({ message: 'Operation is required' })
	policyOperation: string;

	/**
	 * Filter query for policy evaluation
	 * @example 'userId = user._id'
	 */
	@ApiProperty({
		type: String,
		description: 'Optional filter query string used to evaluate access conditions.',
		required: false,
		nullable: true,
		example: 'userId = user._id',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Filter query must be a string' })
	policyFilterQuery?: string | null;

	/**
	 * Update constraint query
	 * @example 'userId = user._id'
	 */
	@ApiProperty({
		type: String,
		description: 'Optional update query string defining field assignment constraints.',
		required: false,
		nullable: true,
		example: 'userId = user._id',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Update query must be a string' })
	policyUpdateQuery?: string | null;

	/**
	 * Connection name the policy belongs to
	 * @example 'Project-Connection-01KA21S91AHPT7YW1CCXJXABHF'
	 */
	@ApiProperty({
		type: String,
		description: 'Connection name the policy belongs to.',
		required: true,
		example: 'Project-Connection-01KA21S91AHPT7YW1CCXJXABHF',
	})
	@Expose()
	@IsString({ message: 'Connection must be a string' })
	@IsNotEmpty({ message: 'Connection is required' })
	connection: string;

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
	 * Policy creation timestamp
	 * @example '2025-11-14T20:44:59.069Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Deployment policy creation timestamp.',
		required: false,
		example: '2025-11-14T20:44:59.069Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'createdAt must be a valid date' })
	createdAt?: Date;

	/**
	 * Policy update timestamp
	 * @example '2025-11-14T20:44:59.069Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Deployment policy update timestamp.',
		required: false,
		example: '2025-11-14T20:44:59.069Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'updatedAt must be a valid date' })
	updatedAt?: Date;
}
