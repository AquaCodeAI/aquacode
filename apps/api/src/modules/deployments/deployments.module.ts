import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeploymentConnectionsModule } from '@aquacode/modules/deployment-connections';
import { DeploymentFilesModule } from '@aquacode/modules/deployment-files';
import { DeploymentMemoriesModule } from '@aquacode/modules/deployment-memories';
import { DeploymentPoliciesModule } from '@aquacode/modules/deployment-policies';
import { FilesModule } from '@aquacode/modules/files';
import { MemoriesModule } from '@aquacode/modules/memories';
import { PoliciesModule } from '@aquacode/modules/policies';
import { SandboxesModule } from '@aquacode/modules/sandboxes';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { Deployment, DeploymentSchema } from './schemas';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Deployment.name, schema: DeploymentSchema }]),
		FilesModule,
		DeploymentConnectionsModule,
		DeploymentFilesModule,
		DeploymentMemoriesModule,
		MemoriesModule,
		PoliciesModule,
		DeploymentPoliciesModule,
		SandboxesModule,
	],
	controllers: [DeploymentsController],
	providers: [DeploymentsService],
	exports: [DeploymentsService],
})
export class DeploymentsModule {}
