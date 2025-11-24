import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class User {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: false })
	name: string;

	@Prop({ type: String, required: true, index: true })
	email: string;

	@Prop({ type: Boolean, required: false, default: false })
	emailVerified: boolean;

	@Prop({ type: Boolean, required: false, default: false })
	banned: boolean;

	@Prop({ type: String, required: false, default: null })
	avatar: string;

	@Prop({ type: String, required: true, index: true, immutable: true })
	connection: string;

	@Prop({ type: Date, default: Date.now })
	createdAt: Date;

	@Prop({ type: Date, default: Date.now })
	updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
