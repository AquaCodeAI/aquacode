import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeploymentConnectionsService } from './deployment-connections.service';
import { DeploymentConnection, DeploymentConnectionSchema } from './schemas';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: DeploymentConnection.name, schema: DeploymentConnectionSchema },
		]),
	],
	providers: [DeploymentConnectionsService],
	exports: [DeploymentConnectionsService],
})
export class DeploymentConnectionsModule {}
