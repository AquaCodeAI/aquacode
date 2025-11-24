import { PickType } from '@nestjs/swagger';
import { CreateFileDto } from './create-file.dto';

export class UpsertFileInSandboxDto extends PickType(CreateFileDto, ['name', 'content'] as const) {}
