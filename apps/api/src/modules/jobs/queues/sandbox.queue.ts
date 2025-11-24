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
import { CreateSandboxJobDataDto } from '../dtos';
import { JobStatus } from '../enums';
import { JobErrors } from '../errors';
import { BaseQueueService } from '../queues';
import { Job, JobDocument } from '../schemas';

@Injectable()
export class SandboxQueue extends BaseQueueService {
	private readonly jobPrefix: string = 'job';

	constructor(
		@InjectModel(Job.name)
		protected readonly jobModel: Model<JobDocument>,
		@InjectQueue(JOBS_QUEUE_NAMES.SANDBOX_JOBS)
		private readonly sandboxJobsQueue: Queue,
	) {
		super(jobModel);
	}

	async queueCreateSandbox(data: CreateSandboxJobDataDto): Promise<Pick<JobDocument, 'jobId'>> {
		try {
			const jobId = generateULID(this.jobPrefix);

			await this.sandboxJobsQueue.add(
				JOBS_QUEUE_JOB_NAMES.CREATE_SANDBOX,
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
				name: JOBS_QUEUE_JOB_NAMES.CREATE_SANDBOX,
				queueName: JOBS_QUEUE_NAMES.SANDBOX_JOBS,
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
