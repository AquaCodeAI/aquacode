import { Module } from '@nestjs/common';
import { DataAccessModule } from '@aquacode/modules/data-access';
import { DeploymentConnectionsModule } from '@aquacode/modules/deployment-connections';
import { DeploymentsModule } from '@aquacode/modules/deployments';
import { RestController } from './rest.controller';
import { RestService } from './rest.service';

@Module({
	imports: [DataAccessModule, DeploymentsModule, DeploymentConnectionsModule],
	controllers: [RestController],
	providers: [RestService],
})
export class RestModule {}
