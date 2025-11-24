import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
	ProjectMetaDataVercel,
	ProjectMetaDataVercelSchema,
} from './project-meta-data-vercel.schema';

@Schema({ _id: false })
export class ProjectMetaData {
	@Prop({ type: ProjectMetaDataVercelSchema })
	vercel: ProjectMetaDataVercel;
}

export const ProjectMetaDataSchema = SchemaFactory.createForClass(ProjectMetaData);
