import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class DeploymentMetaDataVercelDto {
	/**
	 * Vercel deployment identifier
	 * @example 'dpl_4fhaFCb8GYA49w8AV8SLmhco1SuA'
	 */
	@ApiProperty({
		type: String,
		description: 'Vercel deployment identifier.',
		required: false,
		example: 'dpl_4fhaFCb8GYA49w8AV8SLmhco1SuA',
	})
	@Expose()
	@IsOptional()
	@IsString({ message: 'Vercel ID must be a string' })
	id?: string;
}
