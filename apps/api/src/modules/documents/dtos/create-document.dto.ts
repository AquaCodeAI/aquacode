import { PickType } from '@nestjs/swagger';
import { DocumentDto } from './document.dto';

export class CreateDocumentDto extends PickType(DocumentDto, ['_id', '__c', '__s'] as const) {
	[key: string]: any;
}
