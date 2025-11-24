import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
	IsBoolean,
	IsDate,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';

export class ProjectDto {
	/**
	 * Unique project identifier
	 * @example 'prj_01KABWJ6YJD201E0SS4TVBP7HD'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique project identifier in ULID format with prj_ prefix.',
		required: true,
		example: 'prj_01KABWJ6YJD201E0SS4TVBP7HD',
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
	_id: string;

	/**
	 * Project's name
	 * @example 'ai-powered-recipe-finder'
	 */
	@ApiProperty({
		type: String,
		description: "Project's name. Max characters 100.",
		required: true,
		example: 'ai-powered-recipe-finder',
		minLength: 1,
		maxLength: 100,
		pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
	})
	@Expose()
	@IsOptional()
	@Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
	@IsString({ message: 'Name must be a string' })
	@IsNotEmpty({ message: 'Name is required' })
	@MinLength(5, { message: 'Name must be at least 5 character' })
	@MaxLength(100, { message: 'Name must not exceed 100 characters' })
	@Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
		message: 'Name must be lowercase with hyphens only (e.g., "my-project-name")',
	})
	name: string;

	/**
	 * Project description
	 * @example 'Discover delicious recipes with AI recommendations based on ingredients you have'
	 */
	@ApiProperty({
		type: String,
		description: 'Project description. Max characters 500.',
		required: false,
		example: 'Discover delicious recipes with AI recommendations based on ingredients you have',
		maxLength: 500,
		nullable: true,
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Description must be a string' })
	@MaxLength(500, { message: 'Description must not exceed 500 characters' })
	description: string;

	/**
	 * Project domain
	 * @example 'ai-powered-recipe-finder.vercel.app'
	 */
	@ApiProperty({
		type: String,
		description: 'Optional public domain for the project',
		required: false,
		example: 'ai-powered-recipe-finder.vercel.app',
		nullable: true,
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Domain must be a string' })
	domain: string;

	/**
	 * Indicates if the project is a platform project
	 * @example true
	 */
	@ApiProperty({
		type: Boolean,
		description: 'Indicates if the project is a platform project',
		required: true,
		example: true,
	})
	@Expose()
	@IsOptional()
	@IsBoolean({ message: 'isPlatform must be a boolean' })
	isPlatform: boolean;

	/**
	 * Connection name to which the project belongs
	 * @example 'Project-Connection-01KABWJ6XY4BT0RCPFZJ7YYM90'
	 */
	@ApiProperty({
		type: String,
		description: 'Connection name to which the project belongs.',
		required: false,
		nullable: true,
		example: 'Project-Connection-01KABWJ6XY4BT0RCPFZJ7YYM90',
		minLength: 1,
		maxLength: 100,
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Connection must be a string' })
	@MinLength(1, { message: 'Connection must be at least 1 character long' })
	@MaxLength(100, { message: 'Connection must not exceed 100 characters' })
	connection: string;

	/**
	 * Project metadata containing provider-specific information
	 * @example { vercel: { projectId: 'prj_8aL9v82MSrzr1ByOvSqo8LzUqVG1' } }
	 */
	@ApiProperty({
		type: Object,
		description:
			'Project metadata containing provider-specific information (e.g., Vercel project ID)',
		required: false,
		example: { vercel: { projectId: 'prj_8aL9v82MSrzr1ByOvSqo8LzUqVG1' } },
		nullable: true,
	})
	@Expose()
	@IsOptional()
	@IsObject({ message: 'Project metadata must be an object' })
	projectMetaData?: Record<string, any>;

	/**
	 * Project creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Project creation timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Created at must be a valid date' })
	@IsNotEmpty({ message: 'Created at is required' })
	createdAt?: Date;

	/**
	 * Project last update timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Project last update timestamp.',
		required: true,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'Updated at must be a valid date' })
	@IsNotEmpty({ message: 'Updated at is required' })
	updatedAt?: Date;
}
