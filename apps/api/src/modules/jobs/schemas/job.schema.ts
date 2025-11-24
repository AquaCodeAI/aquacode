import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { JobStatus } from '../enums';

export type JobDocument = HydratedDocument<Job>;

@Schema({
	versionKey: false,
	timestamps: true,
})
export class Job {
	@Prop({ type: String, unique: true, index: true, required: true })
	jobId: string;

	@Prop({ type: String, required: true })
	name: string;

	@Prop({ type: String, required: true })
	queueName: string;

	@Prop({ type: Object, required: true })
	data: Record<string, any>;

	@Prop({
		type: String,
		required: false,
		enum: JobStatus,
		default: JobStatus.WAITING,
	})
	status: JobStatus;

	@Prop({ type: Object, required: false })
	result?: Record<string, any>;

	@Prop({ type: String, required: false })
	error?: string;

	@Prop({ type: Number, required: false, default: 0 })
	attempts: number;

	@Prop({ type: Number, required: false })
	processingTime?: number;

	@Prop({ type: Date, required: false })
	startedAt?: Date;

	@Prop({ type: Date, required: false })
	finishedAt?: Date;

	@Prop({ type: Date, default: Date.now })
	createdAt: Date;

	@Prop({ type: Date, default: Date.now })
	updatedAt: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);
