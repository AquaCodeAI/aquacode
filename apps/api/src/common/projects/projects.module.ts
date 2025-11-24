import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project, ProjectSchema } from './schemas';
import { ProjectEnrichmentService } from './services';

@Global()
@Module({
	imports: [MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }])],
	controllers: [ProjectsController],
	providers: [ProjectsService, ProjectEnrichmentService],
	exports: [ProjectsService],
})
export class ProjectsModule {}
