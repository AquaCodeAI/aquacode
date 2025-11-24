import { IncomingHttpHeaders } from 'http';

const DEPLOYMENT_ID_HEADER = 'x-aqua-deployment-id';

/**
 * Extract the deployment ID from request headers.
 * Checks the "x-aqua-deployment-id" header from:
 * - Web Fetch API Headers
 * - Node/Nest IncomingHttpHeaders
 * Returns undefined if not found.
 *
 * Quick examples:
 * ```ts
 * // In a NestJS controller
 * const deploymentId = getDeploymentId(req.headers);
 *
 * // Using fetch (Headers)
 * const headers = new Headers({ 'x-aqua-deployment-id': 'dep_123' });
 * const deploymentId2 = getDeploymentId(headers);
 * ```
 *
 * @param headers Request headers (Web Headers or IncomingHttpHeaders).
 * @returns Deployment ID if present; undefined otherwise.
 */
export const getDeploymentId = (headers?: Headers | IncomingHttpHeaders): string | undefined => {
	if (!headers) return undefined;

	const isWebHeaders = headers instanceof Headers;

	let headerDeploymentId = isWebHeaders
		? headers.get(DEPLOYMENT_ID_HEADER)
		: headers[DEPLOYMENT_ID_HEADER];

	if (Array.isArray(headerDeploymentId)) {
		headerDeploymentId = headerDeploymentId[0];
	}

	return headerDeploymentId || undefined;
};
