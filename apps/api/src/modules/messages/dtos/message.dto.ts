import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';
import { MessageRole, MessageStatus } from '../enums';

export class MessageDto {
	/**
	 * Unique message identifier
	 * @example 'umsg_01KA21TE9W906DPACGTZ494TD2'
	 */
	@ApiProperty({
		type: String,
		required: true,
		description:
			'Unique message identifier in ULID format with umsg_ (user) or aimsg_ (AI) prefix.',
		example: 'umsg_01KA21TE9W906DPACGTZ494TD2',
		pattern: '^(umsg|aimsg)_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 32,
	})
	@Expose()
	@IsString({ message: 'Message ID must be a string' })
	@IsNotEmpty({ message: 'Message ID is required' })
	@MinLength(31, { message: 'Message ID must be at least 31 characters long' })
	@MaxLength(32, { message: 'Message ID must not exceed 32 characters long' })
	@Matches(/^(umsg|aimsg)_[0-9A-Za-z]{26}$/, {
		message:
			'Message ID must be in ULID format: "umsg_" or "aimsg_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * Message role (USER or AI)
	 * @example 'USER'
	 */
	@ApiProperty({
		enum: MessageRole,
		description: 'Message role indicating who sent the message.',
		required: true,
		example: MessageRole.USER,
	})
	@Expose()
	@IsEnum(MessageRole, { message: 'Role must be a valid MessageRole' })
	role: MessageRole;

	/**
	 * Message processing status
	 * @example 'COMPLETED'
	 */
	@ApiProperty({
		enum: MessageStatus,
		description: 'Current processing status of the message.',
		required: true,
		default: MessageStatus.IN_PROGRESS,
		example: MessageStatus.COMPLETED,
	})
	@Expose()
	@IsEnum(MessageStatus, { message: 'Status must be a valid MessageStatus' })
	status?: MessageStatus;

	/**
	 * Message content
	 * @example 'Create a shopping list app with items and quantities'
	 */
	@ApiProperty({
		type: String,
		required: false,
		description: 'Message content text.',
		nullable: true,
		example: 'Create a shopping list app with items and quantities',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Content must be a string' })
	content?: string | null;

	/**
	 * Message summary
	 * @example 'User requested a shopping list application'
	 */
	@ApiProperty({
		type: String,
		required: false,
		description: 'Optional message summary for quick reference.',
		maxLength: 500,
		nullable: true,
		example: 'User requested a shopping list application',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Summary must be a string' })
	@MaxLength(500, { message: 'Summary must not exceed 500 characters' })
	summary?: string | null;

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
	@Matches(/^prj_[0-9A-Za-z]{26}$/i, {
		message: 'Project ID must be in ULID format: "prj_" followed by 26 alphanumeric characters',
	})
	projectId: string;

	/**
	 * User identifier who sent the message
	 * @example 'user_01JV5V3CQ3KVVM7GYR0FX6PRCZ'
	 */
	@ApiProperty({
		type: String,
		description: 'User identifier in ULID format with user_ prefix.',
		required: false,
		example: 'user_01JV5V3CQ3KVVM7GYR0FX6PRCZ',
		pattern: '^user_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
		nullable: true,
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'User ID must be a string' })
	@MinLength(31, { message: 'User ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'User ID must be exactly 31 characters long' })
	@Matches(/^user_[0-9A-Za-z]{26}$/i, {
		message: 'User ID must be in ULID format: "user_" followed by 26 alphanumeric characters',
	})
	userId?: string | null;

	/**
	 * Message creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Message creation timestamp.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'Created at must be a valid date' })
	createdAt?: Date;

	/**
	 * Message update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Message update timestamp.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'Updated at must be a valid date' })
	updatedAt?: Date;
}
