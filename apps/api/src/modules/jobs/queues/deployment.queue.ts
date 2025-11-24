import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
	generateULID,
	InternalServerErrorException,
	ServiceUnavailableException,
} from '@aquacode/common';
import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import { JOBS_QUEUE_JOB_NAMES, JOBS_QUEUE_NAMES } from '../constants';
import { CreateDeploymentPreviewJobDataDto } from '../dtos';
import { JobStatus } from '../enums';
import { JobErrors } from '../errors';
import { Job, JobDocument } from '../schemas';
import { BaseQueueService } from './base.queue';

@Injectable()
export class DeploymentQueue extends BaseQueueService {
	private readonly jobPrefix: string = 'job';

	constructor(
		@InjectModel(Job.name)
		protected readonly jobModel: Model<JobDocument>,
		@InjectQueue(JOBS_QUEUE_NAMES.DEPLOYMENT_JOBS)
		private readonly deploymentJobsQueue: Queue,
	) {
		super(jobModel);
	}

	async queueCreateDeploymentPreview(
		data: CreateDeploymentPreviewJobDataDto,
	): Promise<Pick<JobDocument, 'jobId'>> {
		try {
			const jobId = generateULID(this.jobPrefix);

			await this.deploymentJobsQueue.add(
				JOBS_QUEUE_JOB_NAMES.CREATE_PREVIEW_DEPLOYMENT,
				{ ...data, jobId },
				{
					attempts: 2,
					backoff: {
						type: 'exponential',
						delay: 1000,
					},
					removeOnComplete: false,
					removeOnFail: false,
				},
			);

			await this.jobModel.create({
				jobId,
				name: JOBS_QUEUE_JOB_NAMES.CREATE_PREVIEW_DEPLOYMENT,
				queueName: JOBS_QUEUE_NAMES.DEPLOYMENT_JOBS,
				data,
				status: JobStatus.WAITING,
			});

			return { jobId };
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.name === 'QueueSchedulerError') {
					throw new ServiceUnavailableException({
						errors: JobErrors.QUEUE_SERVICE_UNAVAILABLE,
					});
				}
			}

			throw new InternalServerErrorException({ errors: JobErrors.JOB_CREATION_FAILED });
		}
	}
}
