import { PickType } from '@nestjs/swagger';
import { DeploymentMemoryDto } from './deployment-memory.dto';

export class CreateDeploymentMemoryDto extends PickType(DeploymentMemoryDto, [
	'longTerm',
	'projectId',
	'deploymentId',
] as const) {}
