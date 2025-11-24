import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { AiModelEnum, ProjectIdDto, UserIdDto } from '@aquacode/common';
import { Expose } from 'class-transformer';
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';

export class ChatDto extends IntersectionType(ProjectIdDto, UserIdDto) {
	/**
	 * Message content
	 * @example 'Add a search feature to filter recipes by ingredients'
	 */
	@ApiProperty({
		type: String,
		required: true,
		description: 'Message content',
		example: 'Add a search feature to filter recipes by ingredients',
	})
	@Expose()
	@IsString({ message: 'Message content must be a string' })
	@IsNotEmpty({ message: 'Message content is required' })
	message: string;

	/**
	 * Current route context
	 * @example '/recipes'
	 */
	@ApiProperty({
		type: String,
		required: false,
		description: 'Current route context in the application',
		example: '/recipes',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Current route must be a string' })
	currentRoute: string;

	/**
	 * User message identifier
	 * @example 'umsg_01KA21TE9W906DPACGTZ494TD2'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique user message identifier in ULID format',
		required: true,
		example: 'umsg_01KA21TE9W906DPACGTZ494TD2',
		pattern: '^umsg_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@IsString({ message: 'User message ID must be a string' })
	@IsNotEmpty({ message: 'User message ID is required' })
	@MinLength(31, { message: 'User message ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'User message ID must be exactly 31 characters long' })
	@Matches(/^umsg_[0-9A-Za-z]{26}$/, {
		message:
			'User message ID must be in ULID format: "umsg_" followed by 26 alphanumeric characters',
	})
	userMessageId: string;

	/**
	 * AI message identifier
	 * @example 'aimsg_01KA21TE9W906DPACGTZ494TD2'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique AI message identifier in ULID format',
		required: true,
		example: 'aimsg_01KA21TE9W906DPACGTZ494TD2',
		pattern: '^aimsg_[0-9A-Za-z]{26}$',
		minLength: 32,
		maxLength: 32,
	})
	@Expose()
	@IsString({ message: 'AI message ID must be a string' })
	@IsNotEmpty({ message: 'AI message ID is required' })
	@MinLength(32, { message: 'AI message ID must be exactly 32 characters long' })
	@MaxLength(32, { message: 'AI message ID must be exactly 32 characters long' })
	@Matches(/^aimsg_[0-9A-Za-z]{26}$/, {
		message:
			'AI message ID must be in ULID format: "aimsg_" followed by 26 alphanumeric characters',
	})
	aiMessageId: string;

	/**
	 * AI model identifier
	 * @example 'claude-sonnet-4.5'
	 */
	@ApiProperty({
		type: String,
		description: 'AI model identifier',
		required: true,
		example: 'claude-sonnet-4.5',
		enum: AiModelEnum,
	})
	@Expose()
	@IsString({ message: 'AI model ID must be a string' })
	@IsNotEmpty({ message: 'AI model ID is required' })
	@IsEnum(AiModelEnum, { message: 'AI model ID must be a valid AI model identifier' })
	aiModelId: AiModelEnum;
}
