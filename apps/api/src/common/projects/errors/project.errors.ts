export const ProjectErrors = {
	PROJECT_NOT_FOUND: 'The requested project could not be found. Please verify the project ID.',
	PROJECT_NAME_ALREADY_EXISTS:
		'A project with this name already exists. Please choose a different name.',
	PROJECT_ID_REQUIRED: 'Project ID is required to perform this operation.',
	PROJECT_ID_INVALID_FORMAT:
		'Invalid project ID format. Project ID must follow the pattern: "prj_" followed by 26 alphanumeric characters.',
	PROJECT_DESCRIPTION_IS_REQUIRED:
		'Project description is required to create a project. Please provide a description.',
	PROJECT_ENRICHMENT_FAILED: 'Failed to enrich project after maximum attempts.',
	PROJECT_INVALID_LLM_OUTPUT: 'Invalid output received from the LLM. Cannot parse project data.',
};
