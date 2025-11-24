import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class Account {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, index: true, required: true })
	connection: string;

	@Prop({ type: String, required: true })
	accountId: string;

	@Prop({ type: String, required: true })
	providerId: string;

	@Prop({ type: String, index: true, required: true })
	userId: Date;

	@Prop({ type: String, required: true })
	password: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
