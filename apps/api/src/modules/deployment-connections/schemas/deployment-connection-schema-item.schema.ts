import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({ _id: false })
export class DeploymentConnectionSchemaItem {
	@Prop({ type: String, required: true })
	name: string;

	@Prop({ type: String, required: false })
	prefix: string;

	@Prop({ type: [SchemaTypes.Mixed], required: false, default: [] })
	fields: Record<string, any>[];
}

export const DeploymentConnectionSchemaItemSchema = SchemaFactory.createForClass(
	DeploymentConnectionSchemaItem,
);
