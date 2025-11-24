import { PickType } from '@nestjs/swagger';
import { FileDto } from './file.dto';

export class CreateFileDto extends PickType(FileDto, ['name', 'content', 'projectId'] as const) {}
