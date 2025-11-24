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

export class SessionDto {
	/**
	 * Unique session identifier
	 * @example 'sess_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique session identifier in ULID format.',
		required: true,
		example: 'sess_01JV5V3CVXQNYFM2NHCRBM7KQH',
		pattern: '^sess_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@Transform(({ value, obj }) => value || obj.id)
	@IsString({ message: 'Session ID must be a string' })
	@IsNotEmpty({ message: 'Session ID is required' })
	@MinLength(31, { message: 'Session ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'Session ID must be exactly 31 characters long' })
	@Matches(/^sess_[0-9A-Za-z]{26}$/, {
		message:
			'Session ID must be in ULID format: "sess_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * User identifier associated with the session
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
	 * Session authentication token
	 * @example 'lxR9VUHHwLYgwdGmOTfslpn5OBGBdg1x'
	 */
	@ApiProperty({
		type: String,
		description: 'Session token for authentication.',
		required: true,
		example: 'lxR9VUHHwLYgwdGmOTfslpn5OBGBdg1x',
	})
	@Exclude()
	@IsString({ message: 'Token must be a string' })
	@IsNotEmpty({ message: 'Token is required' })
	token: string;

	/**
	 * Session expiration timestamp
	 * @example '2026-12-31T23:59:59.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Session expiration timestamp.',
		required: true,
		example: '2026-12-31T23:59:59.000Z',
	})
	@Expose()
	@IsDate({ message: 'Expires at must be a valid date' })
	@IsNotEmpty({ message: 'Expires at is required' })
	expiresAt: Date;

	/**
	 * Client IP address
	 * @example '203.0.113.42'
	 */
	@ApiProperty({
		type: String,
		description: 'IP address of the client.',
		required: false,
		example: '203.0.113.42',
	})
	@Exclude()
	@IsString({ message: 'IP address must be a string' })
	@IsOptional()
	ipAddress: string;

	/**
	 * Client user agent string
	 * @example 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
	 */
	@ApiProperty({
		type: String,
		description: 'User agent string from the client.',
		required: true,
		example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
	})
	@Exclude()
	@IsString({ message: 'User agent must be a string' })
	@IsNotEmpty({ message: 'User agent is required' })
	userAgent: string;

	/**
	 * Session creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Session creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsNotEmpty({ message: 'Created at is required' })
	createdAt?: Date;

	/**
	 * Session last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Session last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsNotEmpty({ message: 'Updated at is required' })
	updatedAt?: Date;
}
