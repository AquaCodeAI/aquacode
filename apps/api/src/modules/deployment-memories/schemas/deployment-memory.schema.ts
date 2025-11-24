import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
	DeploymentMemoryLongTerm,
	DeploymentMemoryLongTermSchema,
} from './deployment-memory-long-term.schema';

export type DeploymentMemoryDocument = HydratedDocument<DeploymentMemory>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class DeploymentMemory {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: [DeploymentMemoryLongTermSchema], default: [] })
	longTerm: DeploymentMemoryLongTerm[];

	@Prop({ type: String, required: true })
	projectId: string;

	@Prop({ type: String, required: true, index: true, immutable: true })
	deploymentId: string;
}

export const DeploymentMemorySchema = SchemaFactory.createForClass(DeploymentMemory);
