import { Processor } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@aquacode/common';
import { FilesService } from '@aquacode/modules/files';
import { SandboxesService } from '@aquacode/modules/sandboxes';
import { Job } from 'bullmq';
import { JOBS_QUEUE_JOB_NAMES, JOBS_QUEUE_NAMES } from '../constants';
import { CreateSandboxJobDataDto } from '../dtos';
import { JobErrors } from '../errors';
import { SandboxQueue } from '../queues';
import { BaseProcessor } from './base.processor';

@Injectable()
@Processor(JOBS_QUEUE_NAMES.SANDBOX_JOBS)
export class SandboxProcessor extends BaseProcessor {
	constructor(
		protected readonly baseQueueService: SandboxQueue,
		private readonly sandboxesService: SandboxesService,
		private readonly filesService: FilesService,
	) {
		super(baseQueueService);
	}

	/**
	 * Process the job based on its name
	 */
	protected async processJob(job: Job) {
		switch (job.name) {
			case JOBS_QUEUE_JOB_NAMES.CREATE_SANDBOX:
				return await this.handleCreateSandbox(job.data);
			default:
				throw new BadRequestException({
					errors: JobErrors.UNKNOWN_JOB_TYPE(job.name),
				});
		}
	}

	private async handleCreateSandbox(data: CreateSandboxJobDataDto): Promise<void> {
		const projectId = data.projectId;
		await this.sandboxesService.createVercelSandboxByProjectId(projectId);

		// Once sandbox is running, drain and apply any queued Aqua file changes from Redis
		try {
			await this.filesService.applyQueuedFileChangesByProjectId(projectId);
		} catch {}
	}
}
