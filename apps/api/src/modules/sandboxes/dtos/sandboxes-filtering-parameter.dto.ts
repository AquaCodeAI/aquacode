import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common';
import { SandboxDto } from './sandbox.dto';

export class SandboxesFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(SandboxDto, ['projectId'] as const),
	PartialType(PickType(SandboxDto, ['status'] as const)),
) {}
