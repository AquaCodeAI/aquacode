import { Body, Controller, Delete, Get, HttpCode, Param, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserSession, type UserSession } from '@aquacode/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { CancelChatDto, StartChatDto } from './dtos';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('v1/chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Start Chat' })
	@ApiResponse({
		status: 201,
		description: 'Chat started successfully. Returns a Server-Sent Events (SSE) stream.',
	})
	@ApiResponse({
		status: 400,
		description: 'The provided data is invalid or chat already in progress.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async startChat(
		@Body() startChatDto: StartChatDto,
		@CurrentUserSession() { user }: UserSession,
		@Res() res: Response,
	) {
		// Set SSE headers
		res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
		res.setHeader('Cache-Control', 'no-cache, no-transform');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Accel-Buffering', 'no');
		res.flushHeaders?.();

		await this.chatService.startChat(
			{
				...startChatDto,
				userId: user.id,
			},
			res,
		);
	}

	@Get(':userMessageId')
	@HttpCode(200)
	@ApiOperation({ summary: 'Reconnect Chat' })
	@ApiResponse({
		status: 200,
		description: 'Reconnected to chat successfully. Returns a Server-Sent Events (SSE) stream.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async reconnectChat(@Param() { userMessageId }: CancelChatDto, @Res() res: Response) {
		res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
		res.setHeader('Cache-Control', 'no-cache, no-transform');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Accel-Buffering', 'no');
		res.flushHeaders?.();

		await this.chatService.reconnectChat(userMessageId, res);
	}

	@Delete(':userMessageId')
	@HttpCode(204)
	@ApiOperation({ summary: 'Cancel Chat' })
	@ApiResponse({
		status: 204,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 404,
		description: 'The requested resource or entity could not be found.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async cancelChat(@Param() { userMessageId }: CancelChatDto) {
		await this.chatService.cancelChat(userMessageId);
	}
}
