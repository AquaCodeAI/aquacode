export const JobErrors = {
	JOB_NOT_FOUND: 'The requested job could not be found. Please verify the job ID.',
	JOB_RETRIEVAL_FAILED: 'Failed to retrieve job information. Please try again.',
	JOB_CREATION_FAILED: 'Failed to create job. Please verify the job data and try again.',
	JOB_UPDATE_FAILED: 'Failed to update job status. Please try again.',
	INVALID_JOB_DATA: 'Invalid job data provided. Job ID is required.',
	UNKNOWN_JOB_TYPE: (jobName: string) =>
		`Unknown job type: '${jobName}'. Please verify the job configuration.`,
	QUEUE_SERVICE_UNAVAILABLE: 'Job queue service is currently unavailable.',
};
