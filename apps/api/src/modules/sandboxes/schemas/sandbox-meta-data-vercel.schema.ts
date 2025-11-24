import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SandboxMetaDataVercel {
	@Prop({ type: String, required: true })
	sandboxId: string;

	@Prop({ type: Number, required: false })
	memory?: number | null;

	@Prop({ type: Number, required: false })
	vcpus?: number | null;

	@Prop({ type: String, required: false })
	region?: string | null;

	@Prop({ type: String, required: false })
	runtime?: string | null;

	@Prop({ type: Number, required: false })
	timeout?: number | null;

	@Prop({ type: String, required: false })
	status?: string | null;

	@Prop({ type: Date, required: false })
	requestedAt?: Date | null;

	@Prop({ type: Date, required: false })
	createdAt?: Date | null;

	@Prop({ type: String, required: false })
	cwd?: string | null;

	@Prop({ type: Date, required: false })
	updatedAt?: Date | null;
}

export const SandboxMetaDataVercelSchema = SchemaFactory.createForClass(SandboxMetaDataVercel);
