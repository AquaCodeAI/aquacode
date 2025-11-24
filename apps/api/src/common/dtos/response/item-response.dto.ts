import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsBoolean } from 'class-validator';

export class ItemResponseDto<T> {
	/**
	 * Operation result
	 */
	@ApiProperty({
		description:
			'Operation result. The concrete type is defined by the DTO that extends this generic.',
		required: true,
	})
	@Expose()
	result: T;

	/**
	 * Success indicator
	 * @example true
	 */
	@ApiProperty({
		type: Boolean,
		description: 'Indicates whether the operation was successful.',
		example: true,
	})
	@Expose()
	@IsBoolean()
	success: boolean;

	/**
	 * Error messages
	 * @example ['User not found', 'Invalid credentials']
	 */
	@ApiProperty({
		description: 'List of errors (if any). Empty when success is true.',
		type: [String],
		example: ['User not found', 'Invalid credentials'],
		isArray: true,
	})
	@Expose()
	@IsArray()
	errors: string[];

	/**
	 * Informational messages
	 * @example ['Record created successfully', 'Email notification sent']
	 */
	@ApiProperty({
		description: 'Additional informational messages for the client.',
		type: [String],
		example: ['Record created successfully', 'Email notification sent'],
		isArray: true,
	})
	@Expose()
	@IsArray()
	messages: string[];
}
