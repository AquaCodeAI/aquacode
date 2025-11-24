import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class DeploymentMemoryLongTerm {
	@Prop({ type: String, required: true })
	value: string;

	@Prop({ type: Date, default: Date.now() })
	createdAt: Date;
}

export const DeploymentMemoryLongTermSchema =
	SchemaFactory.createForClass(DeploymentMemoryLongTerm);
