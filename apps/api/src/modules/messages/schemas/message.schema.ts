import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MessageRole, MessageStatus } from '../enums';

export type MessageDocument = HydratedDocument<Message>;

@Schema({
	_id: false,
	timestamps: true,
	versionKey: false,
})
export class Message {
	@Prop({ type: String, required: true, trim: true })
	_id: string;

	@Prop({ type: String, enum: MessageRole, required: true })
	role: MessageRole;

	@Prop({
		type: String,
		enum: MessageStatus,
		default: MessageStatus.IN_PROGRESS,
	})
	status: MessageStatus;

	@Prop({ type: String, required: false, default: null, trim: true })
	content: string | null;

	@Prop({ type: String, required: false })
	summary?: string | null;

	@Prop({ type: String, required: true, index: true })
	projectId: string;

	@Prop({ type: String, required: false })
	userId?: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
