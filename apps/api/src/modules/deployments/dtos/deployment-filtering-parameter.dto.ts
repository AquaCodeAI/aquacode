import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common';
import { DeploymentDto } from './deployment.dto';

export class DeploymentFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(DeploymentDto, ['projectId']),
	PartialType(PickType(DeploymentDto, ['type'])),
) {}
