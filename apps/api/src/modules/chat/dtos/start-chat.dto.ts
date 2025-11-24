import { OmitType } from '@nestjs/swagger';
import { ChatDto } from './chat.dto';

export class StartChatDto extends OmitType(ChatDto, ['userId']) {}
