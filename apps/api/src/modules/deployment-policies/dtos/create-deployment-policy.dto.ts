import { PickType } from '@nestjs/swagger';
import { DeploymentPolicyDto } from './deployment-policy.dto';

export class CreateDeploymentPolicyDto extends PickType(DeploymentPolicyDto, [
	'schemaName',
	'policyName',
	'policyOperation',
	'policyFilterQuery',
	'policyUpdateQuery',
	'connection',
	'deploymentId',
] as const) {}
