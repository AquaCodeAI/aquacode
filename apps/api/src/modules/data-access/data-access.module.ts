import { Module } from '@nestjs/common';
import { DeploymentPoliciesModule } from '@aquacode/modules/deployment-policies';
import { DocumentsModule } from '@aquacode/modules/documents';
import { PoliciesModule } from '@aquacode/modules/policies';
import { DataAccessService } from './data-access.service';
import { FilterEvaluatorService, FilterToMongoService } from './services';

@Module({
	imports: [PoliciesModule, DeploymentPoliciesModule, DocumentsModule],
	providers: [DataAccessService, FilterEvaluatorService, FilterToMongoService],
	exports: [DataAccessService],
})
export class DataAccessModule {}
