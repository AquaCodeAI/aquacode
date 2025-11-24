import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class DeploymentIdDto {
	/**
	 * Unique deployment identifier
	 * @example 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH'
	 */
	@ApiProperty({
		type: String,
		description: 'Unique deployment identifier in ULID format.',
		required: true,
		example: 'dpl_01JV5V3CVXQNYFM2NHCRBM7KQH',
		pattern: '^dpl_[0-9A-Za-z]{26}$',
		minLength: 30,
		maxLength: 30,
	})
	@Expose()
	@IsString({ message: 'Deployment ID must be a string' })
	@IsNotEmpty({ message: 'Deployment ID is required' })
	@MinLength(30, { message: 'Deployment ID must be exactly 30 characters long' })
	@MaxLength(30, { message: 'Deployment ID must be exactly 30 characters long' })
	@Matches(/^dpl_[0-9A-Za-z]{26}$/, {
		message:
			'Deployment ID must be in ULID format: "dpl_" followed by 26 alphanumeric characters',
	})
	deploymentId: string;
}
