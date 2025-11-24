import { PickType } from '@nestjs/swagger';
import { DeploymentFileDto } from './deployment-file.dto';

export class CreateDeploymentFileDto extends PickType(DeploymentFileDto, [
	'name',
	'content',
	'projectId',
	'deploymentId',
] as const) {}
