import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	SandboxMetaDataVercel,
	SandboxMetaDataVercelSchema,
} from './sandbox-meta-data-vercel.schema';

@Schema({ _id: false, timestamps: false })
export class SandboxMetaData {
	@Prop({ type: SandboxMetaDataVercelSchema })
	vercel: SandboxMetaDataVercel;
}

export const SandboxMetaDataSchema = SchemaFactory.createForClass(SandboxMetaData);
