import { ApiProperty } from '@nestjs/swagger';
import { ItemResponseDto, ListResponseDto } from '@aquacode/common';
import { Expose, Type } from 'class-transformer';
import { DeploymentDto } from './deployment.dto';

export class DeploymentListResponseDto extends ListResponseDto<DeploymentDto> {
	/**
	 * List of deployments
	 */
	@ApiProperty({
		type: [DeploymentDto],
		isArray: true,
		description: 'List of deployments',
	})
	@Expose()
	@Type(() => DeploymentDto)
	declare result: DeploymentDto[];
}

export class DeploymentItemResponseDto extends ItemResponseDto<DeploymentDto> {
	/**
	 * Deployment data object
	 */
	@ApiProperty({
		type: DeploymentDto,
		description: 'Deployment data object',
		required: true,
	})
	@Expose()
	@Type(() => DeploymentDto)
	declare result: DeploymentDto;
}
