import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DeploymentConnectionSchemaItemDto {
	/**
	 * Schema name
	 * @example 'Note'
	 */
	@ApiProperty({
		type: String,
		description: 'Schema name identifier.',
		required: true,
		example: 'Note',
		minLength: 1,
		maxLength: 100,
	})
	@Expose()
	@IsString({ message: 'Schema name must be a string' })
	@IsNotEmpty({ message: 'Schema name is required' })
	@MinLength(1, { message: 'Schema name must be at least 1 character' })
	@MaxLength(100, { message: 'Schema name must not exceed 100 characters' })
	name: string;

	/**
	 * Schema prefix
	 * @example 'note'
	 */
	@ApiProperty({
		type: String,
		description: 'Schema prefix for identification.',
		required: false,
		example: 'note',
		minLength: 2,
		maxLength: 5,
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Schema prefix must be a string' })
	@MinLength(2, { message: 'Schema prefix must be at least 2 characters' })
	@MaxLength(5, { message: 'Schema prefix must not exceed 5 characters' })
	prefix: string;

	/**
	 * Schema fields configuration
	 * @example [{ name: 'title', type: 'String', required: true, trim: true, maxlength: 200 }]
	 */
	@ApiProperty({
		type: [Object],
		description:
			'Schema fields configuration defining field properties like name, type, required, default, etc.',
		required: true,
		example: [
			{ name: 'title', type: 'String', required: true, trim: true, maxlength: 200 },
			{ name: 'content', type: 'String', required: false, trim: true },
			{ name: 'completed', type: 'Boolean', default: false },
			{
				name: 'priority',
				type: 'String',
				enum: ['low', 'medium', 'high'],
				default: 'medium',
			},
		],
		isArray: true,
	})
	@Expose()
	@IsArray({ message: 'Fields must be an array' })
	@IsNotEmpty({ message: 'Fields are required' })
	fields: Record<string, any>[];
}
