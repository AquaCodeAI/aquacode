import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { DocumentDto } from './document.dto';

function parseJsonSafe<T>(value: any): T | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === 'object') return value as T;
	try {
		return JSON.parse(String(value));
	} catch {
		return undefined;
	}
}

export class DocumentsFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(DocumentDto, ['__c', '__s'] as const),
) {
	/**
	 * Filter conditions for documents
	 * @example '{"category":"vegetarian","servings":4}'
	 */
	@ApiProperty({
		type: String,
		required: false,
		description:
			'JSON string with filter conditions to be applied to documents. Example: {"category":"vegetarian","servings":4}',
		nullable: true,
		example: '{"category":"vegetarian","servings":4}',
	})
	@IsOptional()
	@IsString({ message: 'filters must be a JSON string' })
	@Transform(({ value }) => parseJsonSafe<Record<string, any>>(value) || {})
	filters?: Record<string, any>;

	/**
	 * Sort order definition
	 * @example '{"createdAt": -1}'
	 */
	@ApiProperty({
		type: String,
		required: false,
		description:
			'JSON string defining sort order. Keys are field names; values are 1 (ascending) or -1 (descending). Example: {"createdAt": -1}',
		nullable: true,
		example: '{"createdAt": -1}',
	})
	@IsOptional()
	@IsString({ message: 'sort must be a JSON string' })
	@Transform(({ value }) => parseJsonSafe<Record<string, 1 | -1>>(value))
	sort?: Record<string, 1 | -1>;
}
