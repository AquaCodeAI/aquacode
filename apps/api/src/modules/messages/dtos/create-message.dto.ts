import { PickType } from '@nestjs/swagger';
import { MessageDto } from './message.dto';

export class CreateMessageDto extends PickType(MessageDto, [
	'_id',
	'role',
	'status',
	'content',
	'projectId',
	'userId',
] as const) {}
