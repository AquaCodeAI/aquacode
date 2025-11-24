import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PolicyDocument = HydratedDocument<Policy>;

@Schema({
	_id: false,
	timestamps: true,
	versionKey: false,
})
export class Policy {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: true, index: true })
	schemaName: string;

	@Prop({ type: String, required: true, index: true })
	policyName: string;

	@Prop({ type: String, required: true, index: true })
	policyOperation: string;

	@Prop({ type: String, required: false, default: null })
	policyFilterQuery?: string | null;

	@Prop({ type: String, required: false, default: null })
	policyUpdateQuery?: string | null;

	@Prop({ type: String, required: true, index: true })
	connection: string;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);
