import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateULID, ItemResponseDto, ListResponseDto } from '@aquacode/common';
import { Model } from 'mongoose';
import { DeploymentPoliciesFilteringParameterDto, InsertDeploymentPoliciesDto } from './dtos';
import { DeploymentPolicy, DeploymentPolicyDocument } from './schemas';

@Injectable()
export class DeploymentPoliciesService {
	private readonly prefix = 'depp';

	constructor(
		@InjectModel(DeploymentPolicy.name)
		private readonly deploymentPolicyModel: Model<DeploymentPolicyDocument>,
	) {}

	async getPolicies(
		filter: DeploymentPoliciesFilteringParameterDto,
	): Promise<ListResponseDto<DeploymentPolicyDocument>> {
		const { page, perPage, deploymentId, connection, schemaName, policyOperation } = filter;

		const queryConditions: Record<string, unknown> = {
			deploymentId,
			...(schemaName && { schemaName }),
			...(connection && { connection }),
		};

		if (policyOperation) {
			queryConditions.policyOperation = {
				$regex: new RegExp(`\\b${policyOperation}\\b`, 'i'),
			};
		}

		let query = this.deploymentPolicyModel.find(queryConditions);
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage).sort({ createdAt: -1 });
		}

		const result = await query;
		const totalCount = await this.deploymentPolicyModel.countDocuments(queryConditions);

		return {
			result,
			resultInfo: {
				page: page || 1,
				perPage: perPage || totalCount,
				totalCount,
			},
			success: true,
			messages: [],
			errors: [],
		};
	}

	async insertDeploymentPolicies(
		doc: InsertDeploymentPoliciesDto,
	): Promise<ItemResponseDto<DeploymentPolicyDocument[]>> {
		const deploymentPolicies = await this.deploymentPolicyModel.insertMany(
			doc.policies.map((deploymentFile) => ({
				_id: generateULID(this.prefix),
				schemaName: deploymentFile.schemaName,
				policyName: deploymentFile.policyName,
				policyOperation: deploymentFile.policyOperation,
				policyFilterQuery: deploymentFile.policyFilterQuery,
				policyUpdateQuery: deploymentFile.policyUpdateQuery,
				connection: deploymentFile.connection,
				deploymentId: deploymentFile.deploymentId,
			})),
		);
		return {
			result: deploymentPolicies,
			success: true,
			messages: [],
			errors: [],
		};
	}
}
