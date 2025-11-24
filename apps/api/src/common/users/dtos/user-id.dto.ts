import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UserIdDto {
	/**
	 * Unique user identifier
	 * @example 'user_01JTM7V2CSQVF0ZS1JS4PMXZFZ'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique user identifier in ULID format.',
		required: true,
		example: 'user_01JTM7V2CSQVF0ZS1JS4PMXZFZ',
		pattern: '^user_[0-9A-Za-z]{26}$',
		minLength: 31,
		maxLength: 31,
	})
	@Expose()
	@IsString({ message: 'User ID must be a string' })
	@IsNotEmpty({ message: 'User ID is required' })
	@MinLength(31, { message: 'User ID must be exactly 31 characters long' })
	@MaxLength(31, { message: 'User ID must be exactly 31 characters long' })
	@Matches(/^user_[0-9A-Za-z]{26}$/, {
		message: 'User ID must be in ULID format: "user_" followed by 26 alphanumeric characters',
	})
	userId: string;
}
