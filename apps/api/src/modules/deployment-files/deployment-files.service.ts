import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateULID, ItemResponseDto, ListResponseDto } from '@aquacode/common';
import { Model } from 'mongoose';
import { DeploymentFileFilteringParameterDto, InsertDeploymentFilesDto } from './dtos';
import { DeploymentFile, DeploymentFileDocument } from './schema';

@Injectable()
export class DeploymentFilesService {
	private readonly deploymentPrefix: string = 'depf';

	constructor(
		@InjectModel(DeploymentFile.name)
		private readonly deploymentFileModel: Model<DeploymentFileDocument>,
	) {}

	async getDeploymentFiles(
		filter: DeploymentFileFilteringParameterDto,
	): Promise<ListResponseDto<DeploymentFileDocument>> {
		const { page, perPage, deploymentId } = filter;

		let query = this.deploymentFileModel.find({ deploymentId });
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage).sort({ updatedAt: -1 });
		}

		const result = await query;
		const totalCount = await this.deploymentFileModel.countDocuments({ deploymentId });

		return {
			result,
			resultInfo: {
				page: page || 1,
				perPage: perPage || totalCount,
				totalCount,
			},
			success: true,
			errors: [],
			messages: [],
		};
	}

	async insertDeploymentFiles(
		doc: InsertDeploymentFilesDto,
	): Promise<ItemResponseDto<DeploymentFileDocument[]>> {
		const deploymentFiles = await this.deploymentFileModel.insertMany(
			doc.files.map((deploymentFile) => ({
				_id: generateULID(this.deploymentPrefix),
				name: deploymentFile.name,
				content: deploymentFile.content,
				projectId: deploymentFile.projectId,
				deploymentId: deploymentFile.deploymentId,
			})),
		);
		return {
			result: deploymentFiles,
			success: true,
			errors: [],
			messages: [],
		};
	}
}
