import { PickType } from '@nestjs/swagger';
import { ChatDto } from './chat.dto';

export class CancelChatDto extends PickType(ChatDto, ['userMessageId']) {}
