import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeploymentPoliciesService } from './deployment-policies.service';
import { DeploymentPolicy, DeploymentPolicySchema } from './schemas';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: DeploymentPolicy.name, schema: DeploymentPolicySchema },
		]),
	],
	providers: [DeploymentPoliciesService],
	exports: [DeploymentPoliciesService],
})
export class DeploymentPoliciesModule {}
