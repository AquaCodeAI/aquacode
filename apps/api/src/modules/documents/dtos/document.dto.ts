import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DocumentDto {
	/**
	 * Unique document identifier
	 * @example 'doc_01KA9FMVEDP5P6GB5JQNW6E4WR'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique document identifier in ULID format.',
		required: true,
		example: 'doc_01KA9FMVEDP5P6GB5JQNW6E4WR',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'ID must be a string' })
	@IsNotEmpty({ message: 'ID is required' })
	_id: string;

	/**
	 * Connection name
	 * @example 'Project-Connection-01KABWJ6XY4BT0RCPFZJ7YYM90'
	 */
	@ApiProperty({
		type: String,
		description: 'Connection name this document belongs to.',
		required: true,
		example: 'Project-Connection-01KABWJ6XY4BT0RCPFZJ7YYM90',
	})
	@Expose()
	@IsString({ message: 'Connection must be a string' })
	@IsNotEmpty({ message: 'Connection is required' })
	__c: string;

	/**
	 * Schema name
	 * @example 'Recipe'
	 */
	@ApiProperty({
		type: String,
		description: 'Schema name (e.g., collection/table).',
		required: true,
		example: 'Recipe',
	})
	@Expose()
	@IsString({ message: 'Schema must be a string' })
	@IsNotEmpty({ message: 'Schema is required' })
	__s: string;

	/**
	 * Document creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Document creation timestamp.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'createdAt must be a valid date' })
	createdAt?: Date;

	/**
	 * Document update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Document update timestamp.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsOptional()
	@IsDate({ message: 'updatedAt must be a valid date' })
	updatedAt?: Date;
}
