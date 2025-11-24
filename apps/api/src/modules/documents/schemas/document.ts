import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DocumentDocument = HydratedDocument<Document>;

@Schema({
	toJSON: {
		transform: (_: any, ret: any): any => {
			delete ret.__c;
			delete ret.__s;
			return ret;
		},
	},
	timestamps: true,
	strict: false,
	versionKey: false,
})
export class Document {
	@Prop({ type: String, required: true, immutable: true })
	_id: string;

	[key: string]: any;

	@Prop({ type: String, required: true, index: true, immutable: true })
	__c!: string;

	@Prop({ type: String, required: true, index: true, immutable: true })
	__s!: string;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
