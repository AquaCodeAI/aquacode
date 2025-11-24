import { PickType } from '@nestjs/swagger';
import { DocumentDto } from './document.dto';

export class DocumentConnectionSchemaQueryDto extends PickType(DocumentDto, [
	'__c',
	'__s',
] as const) {}
