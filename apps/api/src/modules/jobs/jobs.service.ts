import { Injectable } from '@nestjs/common';
import { CreateDeploymentPreviewJobDataDto, CreateSandboxJobDataDto } from './dtos';
import { DeploymentQueue, SandboxQueue } from './queues';

@Injectable()
export class JobsService {
	constructor(
		private readonly sandboxQueue: SandboxQueue,
		private readonly deploymentQueue: DeploymentQueue,
	) {}

	async queueSandboxCreation(data: CreateSandboxJobDataDto) {
		return this.sandboxQueue.queueCreateSandbox(data);
	}

	async queuePreviewDeployment(data: CreateDeploymentPreviewJobDataDto) {
		return this.deploymentQueue.queueCreateDeploymentPreview(data);
	}
}
