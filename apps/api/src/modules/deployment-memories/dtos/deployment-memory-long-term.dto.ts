import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DeploymentMemoryLongTermDto {
	/**
	 * Long-term memory value
	 * @example 'User prefers recipes with vegetarian ingredients'
	 */
	@ApiProperty({
		type: String,
		description: 'Long-term memory value.',
		required: true,
		example: 'User prefers recipes with vegetarian ingredients',
		minLength: 1,
		maxLength: 1000,
	})
	@Expose()
	@IsString({ message: 'Value must be a string' })
	@IsNotEmpty({ message: 'Value is required' })
	@MinLength(1, { message: 'Value must be at least 1 character long' })
	@MaxLength(1000, { message: 'Value must not exceed 1000 characters' })
	value: string;

	/**
	 * Memory creation timestamp
	 * @example '2026-01-01T00:00:00.000Z'
	 */
	@ApiProperty({
		type: Date,
		description: 'Creation timestamp for the memory value.',
		required: false,
		example: '2026-01-01T00:00:00.000Z',
	})
	@Expose()
	@IsDate({ message: 'createdAt must be a valid date' })
	@IsOptional()
	createdAt?: Date;
}
