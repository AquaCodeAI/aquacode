import { PickType } from '@nestjs/swagger';
import { DeploymentConnectionDto } from './deployment-connection.dto';

export class CreateDeploymentConnectionDto extends PickType(DeploymentConnectionDto, [
	'name',
	'schemas',
	'deploymentId',
] as const) {}
