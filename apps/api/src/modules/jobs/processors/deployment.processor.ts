import { Processor } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@aquacode/common';
import { DeploymentsService } from '@aquacode/modules/deployments';
import { Job } from 'bullmq';
import { JOBS_QUEUE_JOB_NAMES, JOBS_QUEUE_NAMES } from '../constants';
import { CreateDeploymentPreviewJobDataDto } from '../dtos';
import { JobErrors } from '../errors';
import { DeploymentQueue } from '../queues';
import { BaseProcessor } from './base.processor';

@Injectable()
@Processor(JOBS_QUEUE_NAMES.DEPLOYMENT_JOBS)
export class DeploymentProcessor extends BaseProcessor {
	constructor(
		protected readonly baseQueueService: DeploymentQueue,
		private readonly deploymentsService: DeploymentsService,
	) {
		super(baseQueueService);
	}

	/**
	 * Process the job based on its name
	 */
	protected async processJob(job: Job): Promise<void> {
		switch (job.name) {
			case JOBS_QUEUE_JOB_NAMES.CREATE_PREVIEW_DEPLOYMENT:
				return await this.handleCreateVercelPreviewDeployment(job.data);
			default:
				throw new BadRequestException({
					errors: JobErrors.UNKNOWN_JOB_TYPE(job.name),
				});
		}
	}

	private async handleCreateVercelPreviewDeployment(
		data: CreateDeploymentPreviewJobDataDto,
	): Promise<void> {
		const projectId = data.projectId;
		await this.deploymentsService.createVercelPreviewDeployment({ projectId });
	}
}
