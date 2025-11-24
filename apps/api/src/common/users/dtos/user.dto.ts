import { ApiProperty, PickType } from '@nestjs/swagger';
import { AccountDto } from '@aquacode/common/accounts';
import { Expose, Transform } from 'class-transformer';
import {
	IsBoolean,
	IsDate,
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';

export class UserDto extends PickType(AccountDto, ['password']) {
	/**
	 * Unique user identifier
	 * @example 'user_01JTM7V2CSQVF0ZS1JS4PMXZFZ'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique user identifier in ULID format.',
		required: true,
		example: 'user_01JTM7V2CSQVF0ZS1JS4PMXZFZ',
		pattern: '^user_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@Transform(({ value, obj }) => value || obj.id)
	@IsString({ message: 'User ID must be a string' })
	@IsNotEmpty({ message: 'User ID is required' })
	@MinLength(31, { message: 'User ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'User ID must be exactly 31 characters long' })
	@Matches(/^user_[0-9A-Za-z]{26}$/, {
		message: 'User ID must be in ULID format: "user_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * User's full name
	 * @example 'Sofia Martinez'
	 */
	@ApiProperty({
		type: String,
		description: "User's name. Max characters 50.",
		required: false,
		example: 'Sofia Martinez',
		minLength: 1,
		maxLength: 50,
	})
	@Expose()
	@IsString({ message: 'Name must be a string' })
	@IsOptional()
	@MinLength(1, { message: 'Name must be at least 1 character' })
	@MaxLength(50, { message: 'Name must not exceed 50 characters' })
	name?: string;

	/**
	 * User's email address
	 * @example 'sofia.martinez@acme.com'
	 */
	@ApiProperty({
		type: String,
		description: "User's email address. Must be a valid email format.",
		required: true,
		example: 'sofia.martinez@acme.com',
		pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$',
		maxLength: 100,
	})
	@Expose()
	@IsEmail({}, { message: 'Please provide a valid email address' })
	@IsNotEmpty({ message: 'Email is required' })
	@MaxLength(100, { message: 'Email must not exceed 100 characters' })
	email: string;

	/**
	 * Email verification status
	 * @example true
	 */
	@ApiProperty({
		type: Boolean,
		description: 'Whether the email is verified.',
		required: false,
		example: true,
		default: false,
	})
	@Expose()
	@IsBoolean({ message: 'Email verified must be a boolean value' })
	@IsOptional()
	emailVerified?: boolean;

	/**
	 * User avatar URL
	 * @example 'https://cdn.acme.com/avatars/sofia-martinez.jpg'
	 */
	@ApiProperty({
		type: String,
		description: 'URL of the user avatar image.',
		required: false,
		example: 'https://cdn.acme.com/avatars/sofia-martinez.jpg',
		maxLength: 2048,
		nullable: true,
	})
	@Expose()
	@IsUrl({ protocols: ['http', 'https'] }, { message: 'Avatar must be a string URL' })
	@IsOptional()
	@MaxLength(2048, { message: 'Avatar URL must not exceed 2048 characters' })
	avatar?: string;

	/**
	 * User ban status
	 * @example false
	 */
	@ApiProperty({
		type: Boolean,
		description: 'Whether the user is banned.',
		required: false,
		example: false,
		default: false,
	})
	@Expose()
	@IsBoolean({ message: 'Banned must be a boolean value' })
	@IsOptional()
	banned?: boolean;

	/**
	 * Connection name to which the user belongs
	 * @example 'Aqua-Connection'
	 */
	@ApiProperty({
		type: String,
		description: 'Connection name to which the user belongs.',
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
	 * User creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'User creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsNotEmpty({ message: 'Created at is required' })
	createdAt: Date;

	/**
	 * User last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'User last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsNotEmpty({ message: 'Updated at is required' })
	updatedAt: Date;
}
