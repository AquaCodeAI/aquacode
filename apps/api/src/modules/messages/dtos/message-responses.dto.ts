import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@aquacode/common';
import { Expose, Type } from 'class-transformer';
import { MessageDto } from './message.dto';

export class MessageListResponseDto extends ListResponseDto<MessageDto> {
	/**
	 * List of messages
	 */
	@ApiProperty({
		type: [MessageDto],
		isArray: true,
		description: 'List of messages',
	})
	@Expose()
	@Type(() => MessageDto)
	declare result: MessageDto[];
}
