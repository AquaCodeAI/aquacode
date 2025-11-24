import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeploymentPolicyDocument = HydratedDocument<DeploymentPolicy>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class DeploymentPolicy {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: true })
	schemaName: string;

	@Prop({ type: String, required: true })
	policyName: string;

	@Prop({ type: String, required: true })
	policyOperation: string;

	@Prop({ type: String, required: false, default: null })
	policyFilterQuery?: string | null;

	@Prop({ type: String, required: false, default: null })
	policyUpdateQuery?: string | null;

	@Prop({ type: String, required: true })
	connection: string;

	@Prop({ type: String, required: true, index: true, immutable: true })
	deploymentId: string;
}

export const DeploymentPolicySchema = SchemaFactory.createForClass(DeploymentPolicy);
