import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ConnectionSchemaItem, ConnectionSchemaItemSchema } from './connection-schema-item.schema';

export type ConnectionDocument = HydratedDocument<Connection>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class Connection {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: true, index: true, immutable: true })
	name: string;

	@Prop({ type: [ConnectionSchemaItemSchema], required: false, default: [] })
	schemas: ConnectionSchemaItem[];
}

export const ConnectionSchema = SchemaFactory.createForClass(Connection);
