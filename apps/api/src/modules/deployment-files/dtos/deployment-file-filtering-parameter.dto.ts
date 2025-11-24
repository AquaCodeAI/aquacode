import { IntersectionType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common';
import { DeploymentFileDto } from './deployment-file.dto';

export class DeploymentFileFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(DeploymentFileDto, ['deploymentId']),
) {}
