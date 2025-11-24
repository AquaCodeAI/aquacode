import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ProjectMetaDataVercel {
	@Prop({ type: String, required: true })
	projectId: string;
}

export const ProjectMetaDataVercelSchema = SchemaFactory.createForClass(ProjectMetaDataVercel);
