import { PickType } from '@nestjs/swagger';
import { DeploymentDto } from './deployment.dto';

export class CreateDeploymentDto extends PickType(DeploymentDto, [
	'type',
	'domain',
	'projectId',
	'sandboxId',
	'promotedFrom',
	'promotedAt',
	'rolledBackFrom',
	'rolledBackTo',
	'rolledBackAt',
	'isRollback',
	'deploymentMetaData',
] as const) {}
