export const DeploymentErrors = {
	DEPLOYMENT_NOT_FOUND:
		'The requested deployment could not be found. Please verify the deployment ID.',
	PREVIEW_DOMAIN_CREATION_FAILED: 'Failed to create preview domain in Vercel. Please try again.',
	DEPLOYMENT_FAILED: 'Deployment failed during build process. Check deployment logs for details.',
	DEPLOYMENT_CANCELED: 'Deployment was canceled before completion.',
	ROLLBACK_REQUIRES_READY_STATUS:
		'Cannot rollback to a deployment that is not in READY status. Only successful deployments can be restored.',
	ROLLBACK_PRODUCTION_NOT_ALLOWED:
		'Cannot rollback to a production deployment. Only preview deployments can be rolled back.',
	ROLLBACK_TO_ROLLBACK_NOT_ALLOWED:
		'Cannot rollback to a deployment that is itself a rollback. Please select an original deployment.',
	DEPLOYMENT_ALREADY_ACTIVE: 'This deployment is already active. No action needed.',
	ROLLBACK_IN_PROGRESS:
		'A rollback to this deployment is already in progress. Please wait for it to complete.',
	ROLLBACK_BLOCKED_BY_SANDBOX:
		'Cannot rollback while a sandbox environment is active. Please wait until the sandbox closes.',
};
