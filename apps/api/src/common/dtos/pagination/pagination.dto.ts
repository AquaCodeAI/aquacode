import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
	/**
	 * Which page number to return. Start from 1
	 */
	@ApiProperty({
		description: 'Which page number to return. Start from 1',
		example: 1,
		required: false,
		type: Number,
		minimum: 1,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	page?: number;

	/**
	 * Number of results to return per request.
	 */
	@ApiProperty({
		description: 'Number of results to return per request.',
		example: 20,
		required: false,
		type: Number,
		minimum: 1,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	perPage?: number;
}
