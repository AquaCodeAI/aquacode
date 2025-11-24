import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FileDocument = HydratedDocument<File>;

@Schema({
	_id: false,
	versionKey: false,
	timestamps: true,
})
export class File {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: true, trim: true, index: true })
	name: string;

	@Prop({ type: String, required: true, trim: true })
	content: string;

	@Prop({ type: String, required: true, index: true })
	projectId: string;
}

export const FileSchema = SchemaFactory.createForClass(File);
