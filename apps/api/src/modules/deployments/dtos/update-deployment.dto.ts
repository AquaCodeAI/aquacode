import { PartialType, PickType } from '@nestjs/swagger';
import { DeploymentDto } from './deployment.dto';

export class UpdateDeploymentDto extends PartialType(
	PickType(DeploymentDto, ['domain', 'status', 'isActive', 'deploymentMetaData'] as const),
) {}
