import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
	DeploymentConnectionSchemaItem,
	DeploymentConnectionSchemaItemSchema,
} from './deployment-connection-schema-item.schema';

export type DeploymentConnectionDocument = HydratedDocument<DeploymentConnection>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class DeploymentConnection {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: true })
	name: string;

	@Prop({ type: [DeploymentConnectionSchemaItemSchema], required: false })
	schemas: DeploymentConnectionSchemaItem[];

	@Prop({ type: String, required: true, index: true, immutable: true })
	deploymentId: string;
}

export const DeploymentConnectionSchema = SchemaFactory.createForClass(DeploymentConnection);
