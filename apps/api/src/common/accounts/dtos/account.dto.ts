import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import {
	IsDate,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';

export class AccountDto {
	/**
	 * Unique account identifier in ULID format
	 * @example 'acct_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique account identifier in ULID format.',
		required: true,
		example: 'acct_01JV5V3CVXQNYFM2NHCRBM7KQH',
		pattern: '^acct_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@Transform(({ value, obj }) => value || obj.id)
	@IsString({ message: 'Account ID must be a string' })
	@IsNotEmpty({ message: 'Account ID is required' })
	@MinLength(31, { message: 'Account ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'Account ID must be exactly 31 characters long' })
	@Matches(/^acct_[0-9A-Za-z]{26}$/, {
		message:
			'Account ID must be in ULID format: "acct_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * Connection name to which the account belongs
	 * @example 'Aqua-Connection'
	 */
	@ApiProperty({
		type: String,
		description: 'Connection name to which the account belongs.',
		required: true,
		example: 'Aqua-Connection',
		minLength: 1,
		maxLength: 100,
	})
	@Expose()
	@IsString({ message: 'Connection must be a string' })
	@IsNotEmpty({ message: 'Connection is required' })
	@MinLength(1, { message: 'Connection must be at least 1 character long' })
	@MaxLength(100, { message: 'Connection must not exceed 100 characters' })
	connection: string;

	/**
	 * Provider identifier (e.g., 'credential')
	 * @example 'credential'
	 */
	@ApiProperty({
		type: String,
		description: 'Provider identifier.',
		required: true,
		example: 'credential',
		maxLength: 100,
	})
	@Expose()
	@IsString({ message: 'Provider ID must be a string' })
	@IsNotEmpty({ message: 'Provider ID is required' })
	@MaxLength(100, { message: 'Provider ID must not exceed 100 characters' })
	providerId: string;

	/**
	 * Provider account identifier
	 * @example 'user_01K8YKHXJTMWFCP01F6WHF0S5Q'
	 */
	@ApiProperty({
		type: String,
		description: 'Provider account identifier.',
		required: true,
		example: 'user_01K8YKHXJTMWFCP01F6WHF0S5Q',
		maxLength: 255,
	})
	@Expose()
	@IsString({ message: 'Account provider identifier must be a string' })
	@IsNotEmpty({ message: 'Account provider identifier is required' })
	@MaxLength(255, { message: 'Account provider identifier must not exceed 255 characters' })
	accountId: string;

	/**
	 * User identifier associated with the account
	 * @example 'user_01JV5V3CQ3KVVM7GYR0FX6PRCZ'
	 */
	@ApiProperty({
		type: String,
		description: 'User identifier in ULID format.',
		required: true,
		example: 'user_01JV5V3CQ3KVVM7GYR0FX6PRCZ',
		pattern: '^user_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@IsString({ message: 'User ID must be a string' })
	@IsNotEmpty({ message: 'User ID is required' })
	@MinLength(31, { message: 'User ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'User ID must be exactly 31 characters long' })
	@Matches(/^user_[0-9A-Za-z]{26}$/, {
		message: 'User ID must be in ULID format: "user_" followed by 26 alphanumeric characters',
	})
	userId: string;

	/**
	 * User's password
	 * @example 'StrongP@ssw0rd'
	 */
	@ApiProperty({
		type: String,
		description:
			"User's password. Must be at least 8 characters and include uppercase, lowercase, and a number or special character.",
		required: true,
		writeOnly: true,
		example: 'StrongP@ssw0rd',
		pattern: '((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$',
		minLength: 8,
		maxLength: 100,
	})
	@Exclude()
	@IsString({ message: 'Password must be a string' })
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	@MaxLength(100, { message: 'Password must not exceed 100 characters' })
	@Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
		message:
			'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
	})
	password: string;

	/**
	 * Account creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Account creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsOptional()
	createdAt?: Date;

	/**
	 * Account last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Account last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsOptional()
	updatedAt?: Date;
}
