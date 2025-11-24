import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ProjectMetaData, ProjectMetaDataSchema } from './project-meta-data.schema';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class Project {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, index: true, required: true, unique: true })
	name: string;

	@Prop({ type: String, required: false, default: null })
	description: string;

	@Prop({ type: String, required: false, default: null })
	domain: string;

	@Prop({ type: Boolean, required: false, default: false })
	isPlatform: boolean;

	@Prop({ type: String, required: true, immutable: true })
	connection: string;

	@Prop({
		type: ProjectMetaDataSchema,
		required: false,
		default: new ProjectMetaData(),
	})
	projectMetaData: ProjectMetaData;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
