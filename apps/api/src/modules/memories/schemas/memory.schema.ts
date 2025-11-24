import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MemoryLongTerm, MemoryLongTermSchema } from './memory-long-term.schema';

export type MemoryDocument = HydratedDocument<Memory>;

@Schema({
	_id: false,
	timestamps: false,
	versionKey: false,
})
export class Memory {
	@Prop({ type: String, required: true })
	_id: string;

	@Prop({ type: String, required: true, unique: true, index: true })
	projectId: string;

	@Prop({ type: [MemoryLongTermSchema], default: [] })
	longTerm: MemoryLongTerm[];
}

export const MemorySchema = SchemaFactory.createForClass(Memory);
