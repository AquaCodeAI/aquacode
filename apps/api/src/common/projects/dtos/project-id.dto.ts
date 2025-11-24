import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ProjectIdDto {
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
	projectId: string;
}
