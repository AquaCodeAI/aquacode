import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document, DocumentSchema } from './schemas';
import { SchemaValidatorService } from './services';

@Module({
	imports: [MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }])],
	controllers: [DocumentsController],
	providers: [DocumentsService, SchemaValidatorService],
	exports: [DocumentsService],
})
export class DocumentsModule {}
