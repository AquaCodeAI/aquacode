import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateULID, ItemResponseDto, NotFoundException } from '@aquacode/common';
import { Model } from 'mongoose';
import { CreateDeploymentConnectionDto } from './dtos';
import { DeploymentConnectionErrors } from './errors';
import { DeploymentConnection, DeploymentConnectionDocument } from './schemas';

@Injectable()
export class DeploymentConnectionsService {
	private readonly connectionPrefix: string = 'depc';

	constructor(
		@InjectModel(DeploymentConnection.name)
		private readonly deploymentConnectionModel: Model<DeploymentConnectionDocument>,
	) {}

	async createDeploymentConnection(
		doc: CreateDeploymentConnectionDto,
	): Promise<ItemResponseDto<DeploymentConnectionDocument>> {
		const deploymentConnection = await this.deploymentConnectionModel.create({
			_id: generateULID(this.connectionPrefix),
			...doc,
		});
		return {
			result: deploymentConnection,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getDeploymentConnectionByDeploymentId(
		deploymentId: string,
	): Promise<ItemResponseDto<DeploymentConnectionDocument>> {
		const deploymentConnection = await this.deploymentConnectionModel.findOne({ deploymentId });
		if (!deploymentConnection)
			throw new NotFoundException({
				errors: DeploymentConnectionErrors.DEPLOYMENT_CONNECTION_NOT_FOUND,
			});
		return {
			result: deploymentConnection,
			success: true,
			messages: [],
			errors: [],
		};
	}
}
