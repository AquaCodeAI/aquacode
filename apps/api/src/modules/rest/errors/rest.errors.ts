export const RestErrors = {
	RESOURCE_NOT_FOUND: 'The requested resource could not be found.',
	SCHEMA_NOT_FOUND: (schema: string) =>
		`Schema '${schema}' not found in the database connection. Please verify the schema name.`,
	SCHEMA_REQUIRED:
		'Schema name is required in the URL path. Expected format: /v1/rest/:schema[/:id]',
	ID_REQUIRED: (schema: string) =>
		`Resource ID is required in the URL path. Expected format: /v1/rest/${schema}/:id`,
	METHOD_NOT_ALLOWED:
		'HTTP method not allowed for this endpoint. Please check the API documentation for supported methods.',
};
