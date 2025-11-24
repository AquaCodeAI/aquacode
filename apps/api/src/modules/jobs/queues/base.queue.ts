import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
	InternalServerErrorException,
	NotFoundException,
	ServiceUnavailableException,
} from '@aquacode/common';
import { Model } from 'mongoose';
import { JobStatus } from '../enums';
import { JobErrors } from '../errors';
import { Job, JobDocument } from '../schemas';

/**
 * Base Queue Service
 *
 * Abstract base class for all queue services.
 * Provides common methods for job status management.
 */
@Injectable()
export abstract class BaseQueueService {
	protected constructor(
		@InjectModel(Job.name)
		protected readonly jobModel: Model<JobDocument>,
	) {}

	/**
	 * Get a job by ID
	 */
	async getJobById(jobId: string): Promise<JobDocument> {
		try {
			const job: JobDocument | null = await this.jobModel.findOne({ jobId });

			if (!job) {
				throw new NotFoundException({ errors: JobErrors.JOB_NOT_FOUND });
			}

			return job;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}

			throw new InternalServerErrorException({ errors: JobErrors.JOB_RETRIEVAL_FAILED });
		}
	}

	/**
	 * Update a job when processing starts
	 */
	async updateJobStart(jobId: string): Promise<JobDocument> {
		try {
			const currentJob: JobDocument = await this.getJobById(jobId);

			const updateData: Partial<JobDocument> = {
				status: JobStatus.ACTIVE,
				startedAt: new Date(),
				attempts: currentJob.attempts + 1,
			};

			const job: JobDocument | null = await this.jobModel.findOneAndUpdate(
				{ jobId },
				updateData,
				{ new: true },
			);

			if (!job) {
				throw new NotFoundException({ errors: JobErrors.JOB_NOT_FOUND });
			}

			return job;
		} catch (error: unknown) {
			if (error instanceof Error) {
				if (error.name === 'QueueSchedulerError') {
					throw new ServiceUnavailableException({
						errors: JobErrors.QUEUE_SERVICE_UNAVAILABLE,
					});
				}
			}

			if (error instanceof NotFoundException) {
				throw error;
			}

			throw new InternalServerErrorException({ errors: JobErrors.JOB_UPDATE_FAILED });
		}
	}

	/**
	 * Update a job when processing completes successfully
	 */
	async updateJobCompletion(jobId: string, result?: Record<string, any>): Promise<JobDocument> {
		try {
			const job: JobDocument = await this.getJobById(jobId);

			const now = new Date();
			const processingTime = job.startedAt
				? now.getTime() - job.startedAt.getTime()
				: undefined;

			const updateData: Partial<JobDocument> = {
				status: JobStatus.COMPLETED,
				finishedAt: now,
				processingTime,
			};

			if (result) {
				updateData.result = result;
			}

			const updatedJob: JobDocument | null = await this.jobModel.findOneAndUpdate(
				{ jobId },
				updateData,
				{ new: true },
			);

			if (!updatedJob) {
				throw new NotFoundException({ errors: JobErrors.JOB_NOT_FOUND });
			}

			return updatedJob;
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'QueueSchedulerError') {
					throw new ServiceUnavailableException({
						errors: JobErrors.QUEUE_SERVICE_UNAVAILABLE,
					});
				}
			}

			if (error instanceof NotFoundException) {
				throw error;
			}

			throw new InternalServerErrorException({ errors: JobErrors.JOB_UPDATE_FAILED });
		}
	}

	/**
	 * Update a job when processing fails but will be retried
	 */
	async updateJobFailure(
		jobId: string,
		error: string,
		attemptsMade: number,
	): Promise<JobDocument> {
		try {
			const updateData: Partial<JobDocument> = {
				status: JobStatus.FAILED,
				error,
				attempts: attemptsMade,
			};

			const job: JobDocument | null = await this.jobModel.findOneAndUpdate(
				{ jobId },
				updateData,
				{ new: true },
			);

			if (!job) {
				throw new NotFoundException({ errors: JobErrors.JOB_NOT_FOUND });
			}

			return job;
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'QueueSchedulerError') {
					throw new ServiceUnavailableException({
						errors: JobErrors.QUEUE_SERVICE_UNAVAILABLE,
					});
				}
			}

			if (error instanceof NotFoundException) {
				throw error;
			}

			throw new InternalServerErrorException({ errors: JobErrors.JOB_UPDATE_FAILED });
		}
	}

	/**
	 * Update a job when all retries are exhausted
	 */
	async updateJobRetriesExhausted(jobId: string, error: string): Promise<JobDocument> {
		try {
			const updateData: Partial<JobDocument> = {
				status: JobStatus.FAILED,
				error,
				finishedAt: new Date(),
			};

			const job: JobDocument | null = await this.jobModel
				.findOneAndUpdate({ jobId }, updateData, { new: true })
				.exec();

			if (!job) {
				throw new NotFoundException({ errors: JobErrors.JOB_NOT_FOUND });
			}

			return job;
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'QueueSchedulerError') {
					throw new ServiceUnavailableException({
						errors: JobErrors.QUEUE_SERVICE_UNAVAILABLE,
					});
				}
			}

			if (error instanceof NotFoundException) {
				throw error;
			}

			throw new InternalServerErrorException({ errors: JobErrors.JOB_UPDATE_FAILED });
		}
	}
}
