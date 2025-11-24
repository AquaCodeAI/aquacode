import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeploymentMemoriesService } from './deployment-memories.service';
import { DeploymentMemory, DeploymentMemorySchema } from './schemas';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: DeploymentMemory.name, schema: DeploymentMemorySchema },
		]),
	],
	providers: [DeploymentMemoriesService],
	exports: [DeploymentMemoriesService],
})
export class DeploymentMemoriesModule {}
