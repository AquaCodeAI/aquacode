import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ItemResponseDto, ListResponseDto, NotFoundException } from '@aquacode/common';
import { Model } from 'mongoose';
import { CreateMessageDto, MessageFilteringParameterDto } from './dtos';
import { MessageRole } from './enums';
import { MessageErrors } from './errors';
import { Message, MessageDocument } from './schemas';

@Injectable()
export class MessagesService {
	private readonly userMessagePrefix: string = 'umsg';
	private readonly aiMessagePrefix: string = 'aimsg';

	constructor(
		@InjectModel(Message.name)
		private readonly messageModel: Model<MessageDocument>,
	) {}

	async getMessages(
		filter: MessageFilteringParameterDto,
	): Promise<ListResponseDto<MessageDocument>> {
		const { page, perPage, projectId } = filter;

		let query = this.messageModel.find({ projectId });
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage).sort({ createdAt: -1 });
		}

		const result: MessageDocument[] = await query;
		const totalCount = await this.messageModel.countDocuments({ projectId });

		return {
			result,
			resultInfo: {
				page: page || 1,
				perPage: perPage || totalCount,
				totalCount,
			},
			success: true,
			messages: [],
			errors: [],
		};
	}

	async createMessage(doc: CreateMessageDto): Promise<ItemResponseDto<MessageDocument>> {
		const messageId =
			doc._id ||
			(doc.role === MessageRole.USER ? this.userMessagePrefix : this.aiMessagePrefix);
		const message = await this.messageModel.create({ ...doc, _id: messageId });
		return {
			result: message,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async updateMessageById(
		messageId: string,
		doc: Partial<Pick<Message, 'status' | 'content' | 'summary'>>,
	): Promise<ItemResponseDto<MessageDocument>> {
		const message = await this.messageModel.findByIdAndUpdate(
			messageId,
			{ $set: doc },
			{ new: true },
		);
		if (!message) throw new NotFoundException({ errors: MessageErrors.MESSAGE_NOT_FOUND });
		return {
			result: message,
			success: true,
			messages: [],
			errors: [],
		};
	}
}
