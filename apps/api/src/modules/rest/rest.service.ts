import { Injectable } from '@nestjs/common';
import {
	BadRequestException,
	ConnectionDocument,
	ConnectionsService,
	getDeploymentId,
	getProjectId,
	MethodNotAllowedException,
	NotFoundException,
	ProjectsService,
} from '@aquacode/common';
import { DataAccessService } from '@aquacode/modules/data-access';
import { DeploymentConnectionsService } from '@aquacode/modules/deployment-connections';
import { DeploymentDocument, DeploymentsService } from '@aquacode/modules/deployments';
import { ProfileDto } from '@aquacode/modules/profile';
import { plainToInstance } from 'class-transformer';
import type { Request, Response } from 'express';
import { RestErrors } from './errors';

@Injectable()
export class RestService {
	private static readonly reservedParams = new Set(['page', 'perPage', 'filter', 'sort']);
	private static readonly defaultPage = 1;
	private static readonly defaultPerPage = 20;
	private static readonly maxPerPage = 100;

	constructor(
		private readonly projectsService: ProjectsService,
		private readonly connectionsService: ConnectionsService,
		private readonly deploymentConnectionsService: DeploymentConnectionsService,
		private readonly deploymentsService: DeploymentsService,
		private readonly dataAccessService: DataAccessService,
	) {}

	async forward(req: Request, res: Response): Promise<void> {
		// Get request parameters or empty object if none exist
		// Example: if URL is '/api/rest/User/123', params might contain { path: 'User/123' }
		const params = req.params || {};

		// Read wildcard path from supported param keys
		// Example: params.path = 'User/123' or params['0'] = 'User/123'
		const rawPath = params.path ?? params['0'];

		// Normalize a wildcard path to a string
		// Example: ['User', '123'] => 'User/123', 'User/123' => 'User/123'
		const wildcardPath = Array.isArray(rawPath) ? rawPath.join('/') : (rawPath ?? '');

		// Split a normalized path into non-empty segments
		// Example: 'User//123/' => ['User', '123']
		const segments = wildcardPath.split('/').filter((segment) => segment.length > 0);

		// Extract schema name and optional document id from path segments
		// Example: ['User', '123'] => { schemaName: 'User', _id: '123' }
		const pathData = segments.length > 0 ? { schemaName: segments[0], _id: segments[1] } : null;

		// Validate that a schema name is present in the path
		// Example: '/api/rest/' (no schema) => throws SCHEMA_REQUIRED
		if (!pathData?.schemaName) {
			throw new BadRequestException({ errors: RestErrors.SCHEMA_REQUIRED });
		}

		// Destructure schema and id from parsed path data
		const { schemaName, _id } = pathData;

		// Resolve project, deployment and connection based on request headers
		// Example: project id from headers => used to load a project and its connection
		const projectId = getProjectId(req.headers)!;
		const { result: project } = await this.projectsService.getProjectById(projectId);

		const deploymentId = getDeploymentId(req.headers);
		let deployment: DeploymentDocument | undefined = undefined;
		if (deploymentId) {
			try {
				const { result: deploymentResult } =
					await this.deploymentsService.getDeploymentById(deploymentId);
				deployment = deploymentResult;
			} catch {}
		}

		let connection: ConnectionDocument;
		if (deployment) {
			const { result: deploymentConnectionResult } =
				await this.deploymentConnectionsService.getDeploymentConnectionByDeploymentId(
					deployment.id,
				);
			connection = deploymentConnectionResult;
		} else {
			const { result: connectionResult } = await this.connectionsService.getConnectionByName(
				project.connection,
			);
			connection = connectionResult;
		}

		// Look up the schema definition inside the resolved connection
		// Example: schemaName = 'User' => connection.schemas.find(s => s.name === 'User')
		const connectionSchema = connection.schemas.find((s) => s.name === schemaName);
		if (!connectionSchema)
			throw new NotFoundException({ errors: RestErrors.SCHEMA_NOT_FOUND(schemaName) });

		// Build user/session context to pass into data access layer
		// Example: req.user / req.session => mapped to ProfileDto with only exposed fields
		const { user, session } = plainToInstance(
			ProfileDto,
			{ user: req?.user, session: req?.session },
			{ excludeExtraneousValues: true },
		);

		// Normalize HTTP method to uppercase before routing
		// Example: 'get' => 'GET'
		const method = req.method.toUpperCase();

		switch (method) {
			case 'GET': {
				// Handle single-document read when id is present
				// Example: GET /api/rest/User/123 => dataAccessService.get({ _id: '123', ... })
				if (_id) {
					const result = await this.dataAccessService.getDocument({
						_id,
						connection,
						connectionSchema,
						deployment,
						user,
						session,
					});
					res.status(200).json(result);
					return;
				}

				// Handle collection read with pagination, filters and sort when no id is present
				// Example: GET /api/rest/User?page=2&perPage=10
				const { page, perPage, filters, sort } = this.extractQueryParams(req);
				const result = await this.dataAccessService.findDocuments(
					{ connection, connectionSchema, deployment, user, session },
					{ page, perPage, filters, sort },
				);
				res.status(200).json(result);
				return;
			}
			case 'POST': {
				// Create a new document using the request body
				// Example: POST /api/rest/User with JSON body => create a User document
				const doc = req.body;
				const response = await this.dataAccessService.createDocument({
					connection,
					connectionSchema,
					deployment,
					user,
					session,
					doc,
				});
				res.status(201).json(response);
				return;
			}
			case 'PATCH': {
				// Require a document id for partial update operations
				// Example: PATCH /api/rest/User/123 => updates User with id '123'
				if (!_id) {
					throw new BadRequestException({ errors: RestErrors.ID_REQUIRED(schemaName) });
				}

				// Apply partial update using payload from the request body
				// Example: body = { name: 'John' } => $set { name: 'John' }
				const update = req.body;
				const result = await this.dataAccessService.updateDocument({
					_id,
					connection,
					connectionSchema,
					deployment,
					user,
					session,
					update,
				});
				res.status(200).json(result);
				return;
			}
			case 'DELETE': {
				// Require a document id for delete operations
				// Example: DELETE /api/rest/User/123 => deletes User with id '123'
				if (!_id) {
					throw new BadRequestException({ errors: RestErrors.ID_REQUIRED(schemaName) });
				}

				// Delegate deletes behavior to the data access service
				const result = await this.dataAccessService.deleteDocument({
					_id,
					connection,
					connectionSchema,
					deployment,
					user,
					session,
				});
				res.status(200).json(result);
				return;
			}
			default:
				// Reject unsupported HTTP methods with 405
				// Example: PUT /api/rest/User/123 => METHOD_NOT_ALLOWED
				throw new MethodNotAllowedException({ errors: RestErrors.METHOD_NOT_ALLOWED });
		}
	}

	private extractQueryParams(req: Request) {
		// Read raw query parameters from the request
		// Example: GET /api/rest/User?page=2&perPage=50&filter={"status":"active"}
		const query = req.query;

		const parsePositiveInt = (value: string | undefined, defaultValue: number): number => {
			// Parse a string into a positive integer or use a default value
			// Example: "3" => 3, "-1" => defaultValue, "abc" => defaultValue
			if (!value) return defaultValue;
			const parsed = parseInt(value, 10);
			return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
		};

		// Compute the current page with fallback to default when missing or invalid
		// Example: page=3 => 3, no page => RestService.defaultPage
		const page = parsePositiveInt(query.page as string, RestService.defaultPage);

		// Compute page size applying an upper limit
		// Example: perPage=200 => RestService.maxPerPage, no perPage => defaultPerPage
		const perPage = Math.min(
			RestService.maxPerPage,
			parsePositiveInt(query.perPage as string, RestService.defaultPerPage),
		);

		// Safely parse JSON-encoded query parameters with a default value
		// Example: parseJsonParam('{"status":"active"}', {}) => { status: 'active' }
		const parseJsonParam = <T = any>(value: any, defaultValue: T): T => {
			if (!value) return defaultValue;

			try {
				const stringValue = typeof value === 'string' ? value : String(value);
				return JSON.parse(stringValue);
			} catch {
				return defaultValue;
			}
		};

		// Coerce raw query values into boolean, number, null, or keep string
		// Example: "true" => true, "42" => 42, "null" => null, "foo" => "foo"
		const coerceValue = (value: any): any => {
			if (Array.isArray(value)) {
				// Recursively coerce each element in array values
				// Example: ["1", "2"] => [1, 2]
				return value.map((v) => coerceValue(v));
			}

			if (typeof value !== 'string') {
				return value;
			}

			const lower = value.toLowerCase();

			// Convert common boolean string values
			// Example: "true" => true, "false" => false
			if (lower === 'true') return true;
			if (lower === 'false') return false;

			// Convert common nullish string values
			// Example: "null" => null, "undefined" => undefined
			if (lower === 'null') return null;
			if (lower === 'undefined') return undefined;

			// Convert numeric strings to numbers when they match exactly
			// Example: "10" => 10, "10.5" => 10.5
			const num = Number(value);
			if (Number.isFinite(num) && String(num) === value) {
				return num;
			}

			// Fallback to the original string when no conversion applies
			return value;
		};

		// Start filters from the JSON "filter" parameter if provided
		// Example: filter={"status":"active"} => filters = { status: 'active' }
		const filters = parseJsonParam<Record<string, unknown>>(query.filter, {});

		// Merge direct query parameters into filters when not reserved
		// Example: isActive=true&type=admin => add isActive and type to filters
		for (const [key, value] of Object.entries(query || {})) {
			// Skip pagination and sort control parameters
			if (RestService.reservedParams.has(key)) continue;
			// Do not override keys already defined in the JSON filter
			if (filters[key] !== undefined) continue;

			const coercedValue = coerceValue(value);
			if (coercedValue !== undefined) {
				filters[key] = coercedValue;
			}
		}

		// Parse sort configuration when provided as JSON
		// Example: sort={"createdAt":-1} => sort = { createdAt: -1 }
		const sort = parseJsonParam(query.sort, undefined);

		// Return normalized query parameters structure used by find operations
		// Example: { page: 1, perPage: 20, filters: { status: 'active' }, sort: { createdAt: -1 } }
		return { page, perPage, filters, sort };
	}
}
