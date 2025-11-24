import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { MessageFilteringParameterDto, MessageListResponseDto } from './dtos';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('v1/messages')
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {}

	@Get()
	@HttpCode(200)
	@ApiOperation({ summary: 'Get Messages' })
	@ApiResponse({
		status: 200,
		type: MessageListResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async getMessages(
		@Query() filter: MessageFilteringParameterDto,
	): Promise<MessageListResponseDto> {
		const messages = await this.messagesService.getMessages(filter);
		return plainToInstance(MessageListResponseDto, messages, {
			excludeExtraneousValues: true,
		});
	}
}
