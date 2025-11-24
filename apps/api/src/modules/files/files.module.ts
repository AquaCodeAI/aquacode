import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SandboxesModule } from '@aquacode/modules/sandboxes';
import { FilesService } from './files.service';
import { File, FileSchema } from './schemas';
import { FilesTemplateService } from './services';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
		SandboxesModule,
	],
	providers: [FilesService, FilesTemplateService],
	exports: [FilesService],
})
export class FilesModule {}
