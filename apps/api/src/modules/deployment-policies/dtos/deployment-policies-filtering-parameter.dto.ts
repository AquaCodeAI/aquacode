import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common';
import { DeploymentPolicyDto } from './deployment-policy.dto';

export class DeploymentPoliciesFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(DeploymentPolicyDto, ['deploymentId'] as const),
	PartialType(
		PickType(DeploymentPolicyDto, ['schemaName', 'policyOperation', 'connection'] as const),
	),
) {}
