import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeploymentFileDocument = HydratedDocument<DeploymentFile>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class DeploymentFile {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: true })
	name: string;

	@Prop({ type: String, required: true })
	content: string;

	@Prop({ type: String, required: true })
	projectId: string;

	@Prop({ type: String, required: true, index: true, immutable: true })
	deploymentId: string;
}

export const DeploymentFileSchema = SchemaFactory.createForClass(DeploymentFile);
