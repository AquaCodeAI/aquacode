import { WorkerHost } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BadRequestException } from '@aquacode/common';
import { Job } from 'bullmq';
import { JobErrors } from '../errors';
import { BaseQueueService } from '../queues';

/**
 * Base Processor
 *
 * Abstract base class for all job processors.
 * Implements common functionality for job processing, error handling, and event management.
 */
@Injectable()
export abstract class BaseProcessor extends WorkerHost implements OnModuleInit {
	protected constructor(protected readonly baseQueueService: BaseQueueService) {
		super();
	}

	/**
	 * Initialize event handlers when the module is initialized
	 */
	onModuleInit() {
		this.worker.on('completed', () => {});

		this.worker.on('failed', (job, error) => {
			if (!job) return;

			if (job.data && typeof job.data === 'object' && 'jobId' in job.data) {
				const jobData = job.data as Record<string, unknown>;
				const jobId = String(jobData.jobId);

				if (job.attemptsMade >= (job.opts.attempts || 1)) {
					void this.baseQueueService
						.updateJobRetriesExhausted(jobId, error.message)
						.catch();
				} else {
					void this.baseQueueService
						.updateJobFailure(jobId, error.message, job.attemptsMade)
						.catch();
				}
			}
		});

		this.worker.on('stalled', () => {});
	}

	/**
	 * Process a job from the queue
	 *
	 * @param job - The job to process
	 * @returns The result of the job processing
	 */
	async process(job: Job): Promise<any> {
		if (!job.data || typeof job.data !== 'object' || !('jobId' in job.data)) {
			throw new BadRequestException({ errors: JobErrors.INVALID_JOB_DATA });
		}

		const jobData = job.data as Record<string, unknown>;
		const jobId = String(jobData.jobId);

		try {
			try {
				await this.baseQueueService.updateJobStart(jobId);
			} catch (startError: unknown) {
				if (!(startError instanceof Error && startError.name === 'NotFoundException')) {
					throw startError;
				}
			}

			const result = await this.processJob(job);

			try {
				await this.baseQueueService.updateJobCompletion(jobId, {
					success: true,
					...(result as Record<string, unknown>),
				});
			} catch {}

			return result;
		} catch (error: unknown) {
			try {
				if (job.attemptsMade >= (job.opts.attempts || 1)) {
					await this.baseQueueService.updateJobRetriesExhausted(
						jobId,
						error instanceof Error ? error.message : String(error),
					);
				} else {
					await this.baseQueueService.updateJobFailure(
						jobId,
						error instanceof Error ? error.message : String(error),
						job.attemptsMade,
					);
				}
			} catch {}

			throw error;
		}
	}

	/**
	 * Process the job based on its name
	 *
	 * This method should be implemented by each processor to handle specific job types.
	 *
	 * @param job - The job to process
	 * @returns The result of the job processing
	 */
	protected abstract processJob(job: Job): Promise<unknown>;
}
