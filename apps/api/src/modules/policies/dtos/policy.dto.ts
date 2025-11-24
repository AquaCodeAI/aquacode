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

export class PolicyDto {
	/**
	 * Unique policy identifier
	 * @example 'pol_01KA21TE9W906DPACGTZ494TD2'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique policy identifier in ULID format.',
		required: true,
		example: 'pol_01KA21TE9W906DPACGTZ494TD2',
		pattern: '^pol_[0-9A-Za-z]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'ID must be a string' })
	@IsNotEmpty({ message: 'ID is required' })
	@MinLength(30, { message: 'Policy ID must be exactly 30 characters long' })
	@MaxLength(30, { message: 'Policy ID must be exactly 30 characters long' })
	@Matches(/^pol_[0-9A-Za-z]{26}$/, {
		message: 'Policy ID must be in ULID format: "pol_" followed by 26 alphanumeric characters',
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
	 * Policy creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Policy creation timestamp.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'createdAt must be a valid date' })
	createdAt?: Date;

	/**
	 * Policy update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Policy update timestamp.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'updatedAt must be a valid date' })
	updatedAt?: Date;
}
