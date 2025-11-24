import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
	IsDate,
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { ConnectionSchemaItemDto } from './connection-schema-item.dto';

export class ConnectionDto {
	/**
	 * Unique connection identifier
	 * @example 'con_01ARZ3NDEKTSV4RRFFQ69G5FAV'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique connection identifier in ULID format.',
		required: true,
		example: 'con_01ARZ3NDEKTSV4RRFFQ69G5FAV',
		pattern: '^con_[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'Connection ID must be a string' })
	@IsNotEmpty({ message: 'Connection ID is required' })
	@MinLength(30, {
		message: 'Connection ID must be exactly 30 characters long',
	})
	@MaxLength(30, {
		message: 'Connection ID must be exactly 30 characters long',
	})
	@Matches(/^con_[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/, {
		message:
			'Connection ID must be in ULID format: "con_" followed by 26 alphanumeric characters',
	})
	_id: string;

	/**
	 * Connection's name
	 * @example 'Aqua-Connection'
	 */
	@ApiProperty({
		type: String,
		description: "Connection's name. Max characters 50.",
		required: true,
		example: 'Aqua-Connection',
		default: 'Aqua-Connection',
		minLength: 1,
		maxLength: 50,
	})
	@Expose()
	@IsString({ message: 'Name must be a string' })
	@IsNotEmpty({ message: 'Name is required' })
	@MinLength(1, { message: 'Name must be at least 1 character' })
	@MaxLength(50, { message: 'Name must not exceed 50 characters' })
	name: string;

	/**
	 * Connection schemas
	 */
	@ApiProperty({
		type: () => [ConnectionSchemaItemDto],
		required: true,
		description: 'Connection schemas configuration',
	})
	@Expose()
	@Type(() => ConnectionSchemaItemDto)
	@ValidateNested({ each: true })
	schemas?: ConnectionSchemaItemDto[];

	/**
	 * Connection creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Connection creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsNotEmpty({ message: 'Created at is required' })
	createdAt?: Date;

	/**
	 * Connection last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Connection last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsNotEmpty({ message: 'Updated at is required' })
	updatedAt?: Date;
}
