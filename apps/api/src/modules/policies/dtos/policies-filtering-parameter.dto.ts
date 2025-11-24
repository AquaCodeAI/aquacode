import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common';
import { PolicyDto } from './policy.dto';

export class PoliciesFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(PolicyDto, ['connection'] as const),
	PartialType(PickType(PolicyDto, ['schemaName', 'policyOperation'] as const)),
) {}
