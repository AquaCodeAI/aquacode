import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeploymentFilesService } from './deployment-files.service';
import { DeploymentFile, DeploymentFileSchema } from './schema';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: DeploymentFile.name, schema: DeploymentFileSchema }]),
	],
	providers: [DeploymentFilesService],
	exports: [DeploymentFilesService],
})
export class DeploymentFilesModule {}
