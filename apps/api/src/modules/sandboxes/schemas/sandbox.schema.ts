import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SandboxStatus } from '../enums';
import { SandboxMetaData, SandboxMetaDataSchema } from './sandbox-meta-data.schema';

export type SandboxDocument = HydratedDocument<Sandbox>;

@Schema({
	_id: false,
	timestamps: true,
	versionKey: false,
})
export class Sandbox {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: false, default: null })
	domain: string;

	@Prop({ type: String, required: true, index: true })
	projectId: string;

	@Prop({ type: Date, default: null, required: false })
	requestedAt?: Date;

	@Prop({ type: String, enum: SandboxStatus, required: true })
	status: SandboxStatus;

	@Prop({ type: SandboxMetaDataSchema, required: false })
	sandboxMetaData?: SandboxMetaData;

	@Prop({ type: Date, default: Date.now, required: false })
	lastActivityAt?: Date;

	@Prop({ type: Date, default: Date.now, required: true })
	createdAt?: Date;

	@Prop({ type: Date, default: Date.now, required: true })
	updatedAt?: Date;
}

export const SandboxSchema = SchemaFactory.createForClass(Sandbox);
