import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateULID, ItemResponseDto, NotFoundException } from '@aquacode/common';
import { Model } from 'mongoose';
import { CreateDeploymentMemoryDto } from './dtos';
import { DeploymentMemoryErrors } from './errors';
import { DeploymentMemory, DeploymentMemoryDocument } from './schemas';

@Injectable()
export class DeploymentMemoriesService {
	private readonly deploymentMemoryPrefix: string = 'depm';

	constructor(
		@InjectModel(DeploymentMemory.name)
		private readonly deploymentMemoryModel: Model<DeploymentMemoryDocument>,
	) {}

	async createDeploymentMemory(
		doc: CreateDeploymentMemoryDto,
	): Promise<ItemResponseDto<DeploymentMemoryDocument>> {
		const deploymentMemory = await this.deploymentMemoryModel.create({
			_id: generateULID(this.deploymentMemoryPrefix),
			longTerm: doc.longTerm,
			projectId: doc.projectId,
			deploymentId: doc.deploymentId,
		});
		return {
			result: deploymentMemory,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getDeploymentMemoryByDeploymentId(
		deploymentId: string,
	): Promise<ItemResponseDto<DeploymentMemoryDocument>> {
		const deploymentMemory = await this.deploymentMemoryModel.findOne({ deploymentId });
		if (!deploymentMemory)
			throw new NotFoundException({
				errors: DeploymentMemoryErrors.DEPLOYMENT_MEMORY_NOT_FOUND,
			});
		return {
			result: deploymentMemory,
			success: true,
			messages: [],
			errors: [],
		};
	}
}
