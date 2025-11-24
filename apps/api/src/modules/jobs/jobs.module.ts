import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeploymentsModule } from '@aquacode/modules/deployments';
import { FilesModule } from '@aquacode/modules/files';
import { SandboxesModule } from '@aquacode/modules/sandboxes';
import { JOBS_QUEUE_NAMES } from './constants';
import { JobsService } from './jobs.service';
import { DeploymentProcessor, SandboxProcessor } from './processors';
import { DeploymentQueue, SandboxQueue } from './queues';
import { Job, JobSchema } from './schemas';

const QUEUE_NAMES = Object.values(JOBS_QUEUE_NAMES);

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
		BullModule.registerQueue(
			...QUEUE_NAMES.map((name) => ({
				name,
				defaultJobOptions: {
					attempts: 5,
					backoff: {
						type: 'exponential',
						delay: 5000,
					},
					removeOnComplete: true,
					removeOnFail: false,
				},
			})),
		),
		SandboxesModule,
		forwardRef(() => FilesModule),
		DeploymentsModule,
	],
	providers: [JobsService, SandboxProcessor, SandboxQueue, DeploymentProcessor, DeploymentQueue],
	exports: [JobsService],
})
export class JobsModule {}
