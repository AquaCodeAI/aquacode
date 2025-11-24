import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DeploymentStatus, DeploymentType } from '../enums';
import { DeploymentMetaData, DeploymentMetaDataSchema } from './deployment-meta-data.schema';

export type DeploymentDocument = HydratedDocument<Deployment>;

@Schema({
	_id: false,
	timestamps: true,
	versionKey: false,
})
export class Deployment {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, enum: DeploymentType, required: true, index: true })
	type: DeploymentType;

	@Prop({ type: String, required: false, default: null })
	domain?: string;

	@Prop({ type: String, enum: DeploymentStatus })
	status?: DeploymentStatus;

	@Prop({ type: Boolean, required: false })
	isActive?: boolean;

	@Prop({ type: String, required: false })
	promotedFrom?: string; // ID of preview deployment that was promoted

	@Prop({ type: Date, required: false })
	promotedAt?: Date; // When preview was promoted to production

	@Prop({ type: Boolean, required: false })
	isRollback?: boolean;

	@Prop({ type: String, required: false })
	rolledBackFrom?: string; // ID of the problematic deployment we rolled back from

	@Prop({ type: String, required: false })
	rolledBackTo?: string; // ID of the stable deployment we rolled back to

	@Prop({ type: Date, required: false })
	rolledBackAt?: Date; // When the rollback was performed

	@Prop({ type: String, required: true, index: true })
	projectId: string;

	@Prop({ type: DeploymentMetaDataSchema, required: false })
	deploymentMetaData?: DeploymentMetaData;
}

export const DeploymentSchema = SchemaFactory.createForClass(Deployment);
