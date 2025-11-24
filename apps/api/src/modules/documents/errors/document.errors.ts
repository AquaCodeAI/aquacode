export const DocumentErrors = {
	SCHEMA_NOT_FOUND: (schema: string) =>
		`Schema '${schema}' not found in the database connection. Please verify the schema name.`,
};
