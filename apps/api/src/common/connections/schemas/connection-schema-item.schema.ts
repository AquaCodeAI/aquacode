import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({ _id: false })
export class ConnectionSchemaItem {
	@Prop({ type: String, required: true })
	name: string;

	@Prop({ type: String, required: true })
	prefix: string;

	@Prop({ type: [SchemaTypes.Mixed], required: false, default: [] })
	fields: Record<string, any>[];
}

export const ConnectionSchemaItemSchema = SchemaFactory.createForClass(ConnectionSchemaItem);
