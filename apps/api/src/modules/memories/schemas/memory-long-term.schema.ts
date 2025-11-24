import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MemoryLongTerm {
	@Prop({ type: String, required: true })
	value: string;

	@Prop({ type: Date, default: Date.now() })
	createdAt: Date;
}

export const MemoryLongTermSchema = SchemaFactory.createForClass(MemoryLongTerm);
