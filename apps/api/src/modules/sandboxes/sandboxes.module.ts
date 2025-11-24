import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesModule } from '@aquacode/modules/files';
import { SandboxesController } from './sandboxes.controller';
import { SandboxesService } from './sandboxes.service';
import { Sandbox, SandboxSchema } from './schemas';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Sandbox.name, schema: SandboxSchema }]),
		forwardRef(() => FilesModule),
	],
	controllers: [SandboxesController],
	providers: [SandboxesService],
	exports: [SandboxesService],
})
export class SandboxesModule {}
