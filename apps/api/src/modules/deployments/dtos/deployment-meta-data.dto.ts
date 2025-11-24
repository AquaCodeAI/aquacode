import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { DeploymentMetaDataVercelDto } from './deployment-meta-data-vercel.dto';

export class DeploymentMetaDataDto {
	/**
	 * Vercel deployment metadata
	 */
	@ApiProperty({
		type: () => DeploymentMetaDataVercelDto,
		required: true,
		description: 'Vercel deployment metadata container',
	})
	@Expose()
	@Type(() => DeploymentMetaDataVercelDto)
	@ValidateNested()
	vercel: DeploymentMetaDataVercelDto;
}
