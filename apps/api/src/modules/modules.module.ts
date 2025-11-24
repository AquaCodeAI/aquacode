import { Module } from '@nestjs/common';
import { ChatModule } from './chat';
import { DataAccessModule } from './data-access';
import { DeploymentConnectionsModule } from './deployment-connections';
import { DeploymentFilesModule } from './deployment-files';
import { DeploymentMemoriesModule } from './deployment-memories';
import { DeploymentPoliciesModule } from './deployment-policies';
import { DeploymentsModule } from './deployments';
import { DocumentsModule } from './documents';
import { FilesModule } from './files';
import { InitializationModule } from './initialization';
import { JobsModule } from './jobs';
import { MemoriesModule } from './memories';
import { MessagesModule } from './messages';
import { PoliciesModule } from './policies';
import { ProfileModule } from './profile';
import { RestModule } from './rest';
import { SandboxesModule } from './sandboxes';
import { SignInModule } from './sign-in';
import { SignOutModule } from './sign-out';
import { SignUpModule } from './sign-up';

@Module({
	imports: [
		InitializationModule,
		ProfileModule,
		SignInModule,
		SignOutModule,
		SignUpModule,
		MessagesModule,
		ChatModule,
		FilesModule,
		JobsModule,
		SandboxesModule,
		MemoriesModule,
		PoliciesModule,
		RestModule,
		DataAccessModule,
		DocumentsModule,
		DeploymentsModule,
		DeploymentPoliciesModule,
		DeploymentMemoriesModule,
		DeploymentFilesModule,
		DeploymentConnectionsModule,
	],
})
export class ModulesModule {}
