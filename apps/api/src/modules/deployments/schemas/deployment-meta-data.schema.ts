import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	DeploymentMetaDataVercel,
	DeploymentMetaDataVercelSchema,
} from './deployment-meta-data-vercel.schema';

@Schema({ _id: false })
export class DeploymentMetaData {
	@Prop({ type: DeploymentMetaDataVercelSchema })
	vercel: DeploymentMetaDataVercel;
}

export const DeploymentMetaDataSchema = SchemaFactory.createForClass(DeploymentMetaData);
