import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, Min, ValidateNested } from 'class-validator';

export class ResultInfoDto {
	/**
	 * Current page number
	 * @example 1
	 */
	@ApiProperty({ type: Number, description: 'Page number (1-indexed).', example: 1, minimum: 1 })
	@Expose()
	@IsNumber()
	@Min(1)
	page: number;

	/**
	 * Items per page
	 * @example 20
	 */
	@ApiProperty({ type: Number, description: 'Items per page.', example: 20, minimum: 1 })
	@Expose()
	@IsNumber()
	@Min(1)
	perPage: number;

	/**
	 * Total item count
	 * @example 125
	 */
	@ApiProperty({ type: Number, description: 'Total number of items.', example: 125, minimum: 0 })
	@Expose()
	@IsNumber()
	@Min(0)
	totalCount: number;
}

export class ListResponseDto<T> {
	/**
	 * List of results
	 * @example []
	 */
	@ApiProperty({
		description:
			'Set of results. The concrete type of items is defined by the DTO that extends this generic.',
		required: true,
		isArray: true,
		example: [],
	})
	@Expose()
	@IsArray()
	result: T[];

	/**
	 * Pagination information
	 */
	@ApiProperty({ type: () => ResultInfoDto, description: 'Pagination information.' })
	@Expose()
	@ValidateNested()
	@Type(() => ResultInfoDto)
	resultInfo: ResultInfoDto;

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
	 * @example ['Schema not found', 'Connection timeout']
	 */
	@ApiProperty({
		description: 'List of errors (if any). Empty when success is true.',
		type: [String],
		example: ['Schema not found', 'Connection timeout'],
		isArray: true,
	})
	@Expose()
	@IsArray()
	errors: string[];

	/**
	 * Informational messages
	 * @example ['Query executed successfully', 'Returned cached results']
	 */
	@ApiProperty({
		description: 'Additional informational messages for the client.',
		type: [String],
		example: ['Query executed successfully', 'Returned cached results'],
		isArray: true,
	})
	@Expose()
	@IsArray()
	messages: string[];
}
