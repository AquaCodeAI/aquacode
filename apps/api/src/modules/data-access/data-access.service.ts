import { Injectable, NotFoundException } from '@nestjs/common';
import {
	BadRequestException,
	ConnectionDocument,
	ConnectionSchemaItem,
	generateULID,
	SessionDto,
	UserDto,
} from '@aquacode/common';
import {
	DeploymentPoliciesService,
	DeploymentPolicyDocument,
} from '@aquacode/modules/deployment-policies';
import { DeploymentDocument } from '@aquacode/modules/deployments';
import { DocumentsService } from '@aquacode/modules/documents';
import { PoliciesService, PolicyDocument } from '@aquacode/modules/policies';
import { DataAccessErrors } from './errors';
import { FilterEvaluatorService, FilterParserService, FilterToMongoService } from './services';

interface DataAccessContext {
	connection: ConnectionDocument;
	connectionSchema: ConnectionSchemaItem;
	deployment?: DeploymentDocument;
	user: UserDto;
	session: SessionDto;
}

interface FindDocumentsOptions {
	page: number;
	perPage: number;
	filters: Record<string, any>;
	sort?: Record<string, 1 | -1>;
}

interface CreateDocumentContext extends DataAccessContext {
	doc: Record<string, any>;
}

interface GetDocumentContext extends DataAccessContext {
	_id: string;
}

interface UpdateDocumentContext extends DataAccessContext {
	_id: string;
	update: Record<string, any>;
}

interface DeleteDocumentContext extends DataAccessContext {
	_id: string;
}

@Injectable()
export class DataAccessService {
	constructor(
		private readonly policiesService: PoliciesService,
		private readonly deploymentPoliciesService: DeploymentPoliciesService,
		private readonly documentsService: DocumentsService,
		private readonly filterEvaluatorService: FilterEvaluatorService,
		private readonly filterToMongoService: FilterToMongoService,
	) {}

	async findDocuments(data: DataAccessContext, options: FindDocumentsOptions) {
		const { connectionSchema, connection, deployment, user, session } = data;
		const { page, perPage, filters = {}, sort } = options;

		// Get policies for this schema/connection
		let policies: DeploymentPolicyDocument[] | PolicyDocument[];
		let resultInfo: {
			page: number;
			perPage: number;
			totalCount: number;
		};

		if (deployment?._id) {
			const { result, resultInfo: info } = await this.deploymentPoliciesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'FIND',
				connection: connection.name,
				deploymentId: deployment._id,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		} else {
			const { result, resultInfo: info } = await this.policiesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'FIND',
				connection: connection.name,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		}

		// Safety check: too many policies
		if (resultInfo.totalCount > 100) {
			throw new BadRequestException({ errors: DataAccessErrors.POLICY_LIMIT_EXCEEDED });
		}

		// Convert policy filters to MongoDB queries
		const policyQueries: Record<string, any>[] = [];
		const context = { user, session };

		for (const policy of policies) {
			const { policyFilterQuery } = policy;

			if (!policyFilterQuery) continue;

			try {
				// Parse filter query
				const expression = FilterParserService.parse(policyFilterQuery);
				if (!expression) {
					continue;
				}

				// Convert to a MongoDB query with context resolution
				const mongoQuery = this.filterToMongoService.toMongoQuery(expression, context);

				if (Object.keys(mongoQuery).length > 0) {
					policyQueries.push(mongoQuery);
				}
			} catch (error) {
				throw new BadRequestException({
					errors: DataAccessErrors.POLICY_VALIDATION_FAILED,
				});
			}
		}

		// Build base filters (only user-provided filters)
		const baseFilters = {
			...filters,
		};

		// Combine all filters
		let finalQuery: Record<string, any> = baseFilters;

		if (policyQueries.length > 0) {
			// User must match at least one policy (OR logic between policies)
			finalQuery = {
				...baseFilters,
				$or: policyQueries,
			};
		} else if (policies.length > 0) {
			// If there are policies but none have filterQuery, it means no access
			throw new BadRequestException({
				errors: DataAccessErrors.NO_APPLICABLE_FIND_POLICIES,
			});
		}

		// Execute a query with pagination
		const result = await this.documentsService.findDocuments({
			__c: connection.name,
			__s: connectionSchema.name,
			page,
			perPage,
			filters: finalQuery,
			sort: sort || { createdAt: -1 },
		});

		return {
			...result,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async createDocument(data: CreateDocumentContext) {
		const { connection, connectionSchema, deployment, user, session, doc } = data;

		// Get policies for this schema/connection
		let policies: DeploymentPolicyDocument[] | PolicyDocument[];
		let resultInfo: {
			page: number;
			perPage: number;
			totalCount: number;
		};

		if (deployment?._id) {
			const { result, resultInfo: info } = await this.deploymentPoliciesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'CREATE',
				connection: connection.name,
				deploymentId: deployment._id,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		} else {
			const { result, resultInfo: info } = await this.policiesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'CREATE',
				connection: connection.name,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		}

		// Optional: safety check
		if (resultInfo.totalCount > 100) {
			throw new BadRequestException({ errors: DataAccessErrors.POLICY_LIMIT_EXCEEDED });
		}

		// Remove system fields from user payload
		const { _id, __c, __s, ...userDoc } = doc ?? {};

		// Prepare the document with base fields
		const documentToCreate = {
			...userDoc,
			_id: generateULID(connectionSchema.prefix),
			__s: connectionSchema.name,
			__c: connection.name,
		};

		const context = { user, session };

		// If there are policies, apply updateQuery auto-assignments
		if (policies.length > 0) {
			// Apply policies with updateQuery
			for (const policy of policies) {
				const { policyUpdateQuery } = policy;

				if (!policyUpdateQuery) continue;

				const assignments = this.parseUpdateQuery(policyUpdateQuery);

				for (const [field, value] of Object.entries(assignments)) {
					// Resolve context values (e.g., user._id, session._id)
					// Override whatever the user sent with the policy value
					documentToCreate[field] = this.resolveContextValue(value, context, true);
				}
			}
		}

		// Create the document
		const document = await this.documentsService.createDocument(documentToCreate);
		return {
			result: document,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getDocument(options: GetDocumentContext) {
		const { _id, connection, connectionSchema, deployment, user, session } = options;

		// Get policies for this schema/connection
		let policies: DeploymentPolicyDocument[] | PolicyDocument[];
		let resultInfo: {
			page: number;
			perPage: number;
			totalCount: number;
		};

		if (deployment?._id) {
			const { result, resultInfo: info } = await this.deploymentPoliciesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'GET',
				connection: connection.name,
				deploymentId: deployment._id,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		} else {
			const { result, resultInfo: info } = await this.policiesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'GET',
				connection: connection.name,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		}

		const document = await this.documentsService.getDocumentById({
			_id,
			__c: connection.name,
			__s: connectionSchema.name,
		});

		if (!document) {
			throw new NotFoundException({
				errors: DataAccessErrors.DOCUMENT_NOT_FOUND,
			});
		}

		// No policies means access is allowed
		if (resultInfo.totalCount === 0) {
			return {
				result: document,
				success: true,
				messages: [],
				errors: [],
			};
		}

		// Safety check: too many policies
		if (resultInfo.totalCount > 100) {
			throw new BadRequestException({
				errors: DataAccessErrors.POLICY_LIMIT_EXCEEDED,
			});
		}

		// Evaluate each policy
		let hasAccess = false;
		const context = { user, session };

		for (const policy of policies) {
			try {
				const { policyFilterQuery } = policy;

				// No filter means policy applies to all
				if (!policyFilterQuery) {
					hasAccess = true;
					break;
				}

				// Parse and evaluate the filter
				const expression = FilterParserService.parse(policyFilterQuery);
				if (!expression) {
					// Empty/whitespace filter; treat as "applies to all"
					hasAccess = true;
					break;
				}

				const canAccess = this.filterEvaluatorService.evaluate(
					expression,
					document,
					context,
				);

				if (canAccess) {
					hasAccess = true;
					break;
				}
			} catch (error: unknown) {
				throw new BadRequestException({
					errors: DataAccessErrors.POLICY_VALIDATION_FAILED,
				});
			}
		}

		if (!hasAccess) {
			throw new BadRequestException({
				errors: DataAccessErrors.ACCESS_DENIED_READ,
			});
		}

		return {
			result: document,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async updateDocument(data: UpdateDocumentContext) {
		const { _id, connectionSchema, connection, deployment, update, user, session } = data;

		// Get policies for this schema/connection
		let policies: DeploymentPolicyDocument[] | PolicyDocument[];
		let resultInfo: {
			page: number;
			perPage: number;
			totalCount: number;
		};

		if (deployment?._id) {
			const { result, resultInfo: info } = await this.deploymentPoliciesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'UPDATE',
				connection: connection.name,
				deploymentId: deployment._id,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		} else {
			const { result, resultInfo: info } = await this.policiesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'UPDATE',
				connection: connection.name,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		}

		// Safety check: too many policies
		if (resultInfo.totalCount > 100) {
			throw new BadRequestException({
				errors: DataAccessErrors.POLICY_LIMIT_EXCEEDED,
			});
		}

		// Get the existing document
		const existingDocument = await this.documentsService.getDocumentById({
			_id,
			__c: connection.name,
			__s: connectionSchema.name,
		});

		if (!existingDocument) {
			throw new NotFoundException({ errors: DataAccessErrors.DOCUMENT_NOT_FOUND });
		}

		// Sanitize updates - remove protected fields
		const {
			_id: ignoreId,
			__s: ignoreS,
			__c: ignoreC,
			createdAt,
			updatedAt,
			...sanitizedUpdates
		} = update;

		const context = { user, session };

		// Check if user has access to update this document (via filterQuery)
		let hasAccess = false;

		if (policies.length === 0) {
			// No policies means access is allowed
			hasAccess = true;
		} else {
			for (const policy of policies) {
				const { policyFilterQuery } = policy;

				// No filter means policy applies to all
				if (!policyFilterQuery) {
					hasAccess = true;
					break;
				}

				try {
					// Parse and evaluate the filter against existing document
					const expression = FilterParserService.parse(policyFilterQuery);
					if (!expression) {
						// Empty/whitespace filter; treat as "applies to all"
						hasAccess = true;
						break;
					}

					const canAccess = this.filterEvaluatorService.evaluate(
						expression,
						existingDocument,
						context,
					);

					if (canAccess) {
						hasAccess = true;
						break;
					}
				} catch (error) {
					throw new BadRequestException({
						errors: DataAccessErrors.POLICY_VALIDATION_FAILED,
					});
				}
			}
		}

		if (!hasAccess) {
			throw new BadRequestException({
				errors: DataAccessErrors.ACCESS_DENIED_UPDATE,
			});
		}

		// Apply updateQuery to enforce field values
		const finalUpdates = { ...sanitizedUpdates };

		for (const policy of policies) {
			const { policyUpdateQuery, policyFilterQuery } = policy;

			if (!policyUpdateQuery) continue;

			// Check if the policy applies (via filterQuery)
			let policyApplies = !policyFilterQuery; // No filter means applies to all

			if (policyFilterQuery && !policyApplies) {
				try {
					const expression = FilterParserService.parse(policyFilterQuery);
					if (!expression) {
						policyApplies = true;
					} else {
						policyApplies = this.filterEvaluatorService.evaluate(
							expression,
							existingDocument,
							context,
						);
					}
				} catch (error) {
					throw new BadRequestException({
						errors: DataAccessErrors.POLICY_VALIDATION_FAILED,
					});
				}
			}

			if (policyApplies) {
				// Don't wrap this in try-catch, let the BadRequestException propagate
				const assignments = this.parseUpdateQuery(policyUpdateQuery);

				for (const [field, value] of Object.entries(assignments)) {
					// Resolve and override with policy value
					finalUpdates[field] = this.resolveContextValue(value, context, true);
				}
			}
		}

		// Update the document
		const updatedDocument = await this.documentsService.updateDocument({
			_id,
			data: finalUpdates,
			__c: connection.name,
			__s: connectionSchema.name,
		});

		if (!updatedDocument) {
			throw new NotFoundException({ errors: DataAccessErrors.DOCUMENT_NOT_FOUND });
		}

		return {
			result: updatedDocument,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async deleteDocument(data: DeleteDocumentContext) {
		const { _id, connection, connectionSchema, deployment, user, session } = data;

		// Get policies for this schema/connection
		let policies: DeploymentPolicyDocument[] | PolicyDocument[];
		let resultInfo: {
			page: number;
			perPage: number;
			totalCount: number;
		};

		if (deployment?._id) {
			const { result, resultInfo: info } = await this.deploymentPoliciesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'DELETE',
				connection: connection.name,
				deploymentId: deployment._id,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		} else {
			const { result, resultInfo: info } = await this.policiesService.getPolicies({
				schemaName: connectionSchema.name,
				policyOperation: 'DELETE',
				connection: connection.name,
				page: 1,
				perPage: 100,
			});

			policies = result;
			resultInfo = info;
		}

		// Safety check: too many policies
		if (resultInfo.totalCount > 100) {
			throw new BadRequestException({
				errors: DataAccessErrors.POLICY_LIMIT_EXCEEDED,
			});
		}

		// Get the existing document
		const existingDocument = await this.documentsService.getDocumentById({
			_id,
			__c: connection.name,
			__s: connectionSchema.name,
		});

		if (!existingDocument) {
			throw new NotFoundException({
				errors: DataAccessErrors.DOCUMENT_NOT_FOUND,
			});
		}

		const context = { user, session };

		// Check if user has access to delete this document (via filterQuery)
		let hasAccess = false;

		if (policies.length === 0) {
			// No policies means access is allowed
			hasAccess = true;
		} else {
			for (const policy of policies) {
				const { policyFilterQuery } = policy;

				// No filter means policy applies to all
				if (!policyFilterQuery) {
					hasAccess = true;
					break;
				}

				try {
					// Parse and evaluate the filter against existing document
					const expression = FilterParserService.parse(policyFilterQuery);
					if (!expression) {
						// Empty/whitespace filter; treat as "applies to all"
						hasAccess = true;
						break;
					}

					const canAccess = this.filterEvaluatorService.evaluate(
						expression,
						existingDocument,
						context,
					);

					if (canAccess) {
						hasAccess = true;
						break;
					}
				} catch {
					throw new BadRequestException({
						errors: DataAccessErrors.POLICY_VALIDATION_FAILED,
					});
				}
			}
		}

		if (!hasAccess) {
			throw new BadRequestException({
				errors: DataAccessErrors.ACCESS_DENIED_DELETE,
			});
		}

		// Delete the document
		const deleted = await this.documentsService.deleteDocument({
			_id,
			__c: connection.name,
			__s: connectionSchema.name,
		});

		if (!deleted) {
			throw new NotFoundException({
				errors: DataAccessErrors.DOCUMENT_NOT_FOUND,
			});
		}

		// Return the deleted document for reference
		return {
			result: deleted,
			success: true,
			messages: ['Document deleted successfully'],
			errors: [],
		};
	}

	/**
	 * Parse updateQuery to extract field assignments
	 * Example: "userId = user._id AND sessionId = session.sessionId"
	 * Returns: { userId: "user._id", sessionId: "session.sessionId" }
	 */
	private parseUpdateQuery(updateQuery: string): Record<string, string> {
		const assignments: Record<string, string> = {};

		// Split by AND
		const parts = updateQuery.split(/\s+AND\s+/i);

		for (const part of parts) {
			// Match pattern: field = value
			const match = part.trim().match(/^(\w+)\s*=\s*(.+)$/);
			if (match) {
				const [, field, value] = match;
				assignments[field.trim()] = value.trim();
			}
		}

		return assignments;
	}

	/**
	 * Resolve context values like "user._id" or "session.tenantId"
	 * @param value The value to resolve (e.g., "user._id")
	 * @param context The context object containing user and session
	 * @param requireContext If true, throws an error when value cannot be resolved
	 *
	 * @Note This duplicates some logic from FilterEvaluatorService / FilterToMongoService.
	 * In a future iteration we should extract a shared context-resolver utility.
	 */
	private resolveContextValue(
		value: string,
		context: Record<string, any>,
		requireContext: boolean = false,
	): any {
		// Remove quotes if present
		const cleanValue = value.replace(/^["']|["']$/g, '');

		// Check if it's a context reference (e.g., "user._id", "session.tenantId")
		const parts = cleanValue.split('.');
		const root = parts[0];

		// Only allow specific roots to be resolved from context for safety
		const allowedRoots = ['user', 'session'] as const;

		if (parts.length > 1 && allowedRoots.includes(root as any) && root in context) {
			let current = context[root];

			// Validate that the root context exists
			if (
				(current === null || current === undefined || Object.keys(current).length === 0) &&
				requireContext
			) {
				throw new BadRequestException({
					errors: DataAccessErrors.AUTH_REQUIRED_MISSING_CONTEXT(cleanValue),
				});
			}

			for (const key of parts.slice(1)) {
				if (current === null || current === undefined) {
					if (requireContext) {
						throw new BadRequestException({
							errors: DataAccessErrors.AUTH_REQUIRED_MISSING_CONTEXT(cleanValue),
						});
					}
					return cleanValue; // Fallback para casos no críticos
				}
				current = current[key];
			}

			// Validate final resolved value
			if ((current === null || current === undefined) && requireContext) {
				throw new BadRequestException({
					errors: DataAccessErrors.AUTH_REQUIRED_UNRESOLVED_REFERENCE(cleanValue),
				});
			}

			return current;
		}

		// Return as literal value
		return cleanValue;
	}
}
