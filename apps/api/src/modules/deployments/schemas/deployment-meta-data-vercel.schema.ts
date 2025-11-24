import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class DeploymentMetaDataVercel {
	@Prop({ type: String, required: true })
	id?: string;
}

export const DeploymentMetaDataVercelSchema =
	SchemaFactory.createForClass(DeploymentMetaDataVercel);
