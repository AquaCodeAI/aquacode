import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateULID, ItemResponseDto, ListResponseDto } from '@aquacode/common';
import { Model } from 'mongoose';
import { PoliciesFilteringParameterDto, RollbackPolicyDto, UpsertPolicyDto } from './dtos';
import { Policy, PolicyDocument } from './schemas';

@Injectable()
export class PoliciesService {
	private readonly policyPrefix: string = 'pol';

	constructor(
		@InjectModel(Policy.name)
		private readonly policyModel: Model<PolicyDocument>,
	) {}

	async getPolicies(
		filter: PoliciesFilteringParameterDto,
	): Promise<ListResponseDto<PolicyDocument>> {
		const { policyOperation, schemaName, connection, page, perPage } = filter;

		// Build the base query
		const queryConditions: Record<string, unknown> = {
			connection,
			...(schemaName && { schemaName }),
		};

		// If an operation is provided, filter policies that include this operation
		// Support for multiple operations in a single string like "FIND - GET - UPDATE - DELETE"
		if (policyOperation) {
			// Use regex with the word boundary to match the exact operation within the string
			// Examples:
			// - operation="UPDATE" matches "UPDATE"
			// - operation="UPDATE" matches "FIND - GET - UPDATE - DELETE"
			// - operation="UPDATE" does NOT match "FIND - GET - DELETE"
			queryConditions.policyOperation = {
				$regex: new RegExp(`\\b${policyOperation}\\b`, 'i'),
			};
		}

		// Build the query with filters
		let query = this.policyModel.find(queryConditions);
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage).sort({ createdAt: -1 });
		}

		const result: PolicyDocument[] = await query;
		const totalCount = await this.policyModel.countDocuments(queryConditions);

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

	async upsertPolicy(doc: UpsertPolicyDto): Promise<ItemResponseDto<PolicyDocument>> {
		const policyId = generateULID(this.policyPrefix);
		const policy = await this.policyModel.findOneAndUpdate(
			{
				schemaName: doc.schemaName,
				policyName: doc.policyName,
				connection: doc.connection,
			},
			{
				$set: doc,
				$setOnInsert: { _id: policyId },
			},
			{
				upsert: true,
				new: true,
			},
		);
		return {
			result: policy,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async rollbackPoliciesByConnection(connection: string, doc: RollbackPolicyDto): Promise<void> {
		await this.policyModel.bulkWrite([
			{
				deleteMany: {
					filter: { connection },
				},
			},
			...doc.policies.map((doc) => ({
				insertOne: {
					document: {
						_id: generateULID(this.policyPrefix),
						schemaName: doc.schemaName,
						policyName: doc.policyName,
						policyOperation: doc.policyOperation,
						policyFilterQuery: doc.policyFilterQuery,
						policyUpdateQuery: doc.policyUpdateQuery,
						connection: doc.connection,
					},
				},
			})),
		]);
	}
}
