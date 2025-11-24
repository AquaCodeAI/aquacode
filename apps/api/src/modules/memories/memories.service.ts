import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateULID, ItemResponseDto } from '@aquacode/common';
import { Model } from 'mongoose';
import { RollbackMemoryDto } from './dtos';
import { Memory, MemoryDocument } from './schemas';

@Injectable()
export class MemoriesService {
	private readonly memoryPrefix: string = 'mem';

	constructor(
		@InjectModel(Memory.name)
		private readonly memoryModel: Model<MemoryDocument>,
	) {}

	async getMemoryByProjectId(projectId: string): Promise<ItemResponseDto<MemoryDocument>> {
		const memory = await this.memoryModel.findOneAndUpdate(
			{ projectId },
			{ $setOnInsert: { _id: generateULID(this.memoryPrefix), projectId } },
			{ new: true, upsert: true },
		);
		return {
			result: memory,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async rollbackMemoryByProjectId(
		projectId: string,
		doc: RollbackMemoryDto,
	): Promise<ItemResponseDto<MemoryDocument>> {
		await this.memoryModel.deleteOne({ projectId });
		const newMemory = await this.memoryModel.create({
			_id: generateULID(this.memoryPrefix),
			projectId,
			longTerm: doc.longTerm.map((value) => ({ value, createdAt: new Date() })),
		});
		return {
			result: newMemory,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async pushMemoryLongTermByProjectId(
		projectId: string,
		longMemory: string,
	): Promise<ItemResponseDto<MemoryDocument>> {
		const memory = await this.memoryModel.findOneAndUpdate(
			{ projectId },
			{
				$setOnInsert: { _id: generateULID(this.memoryPrefix), projectId },
				$push: { longTerm: { value: longMemory, createdAt: new Date() } },
			},
			{ new: true, upsert: true },
		);
		return {
			result: memory,
			success: true,
			messages: [],
			errors: [],
		};
	}
}
