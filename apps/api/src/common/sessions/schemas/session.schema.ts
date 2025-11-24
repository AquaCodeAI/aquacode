import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class Session {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: true })
	expiresAt: Date;

	@Prop({ type: String, required: true, index: true })
	token: string;

	@Prop({ type: String, required: false })
	ipAddress: string;

	@Prop({ type: String, required: false })
	userAgent: string;

	@Prop({ type: String, required: true, index: true })
	userId: string;

	@Prop({ type: String, required: true, index: true, immutable: true })
	connection: string;

	@Prop({ type: Date, default: Date.now })
	createdAt: Date;

	@Prop({ type: Date, default: Date.now })
	updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
