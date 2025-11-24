import { IncomingHttpHeaders } from 'http';

const PROJECT_ID_HEADER = 'x-aqua-project-id';

/**
 * Extract the project ID from request headers.
 * Checks the "x-aqua-project-id" header from:
 * - Web Fetch API Headers
 * - Node/Nest IncomingHttpHeaders
 * Returns undefined if not found.
 *
 * Quick examples:
 * ```ts
 * // In a NestJS controller
 * const projectId = getProjectId(req.headers);
 *
 * // Using fetch (Headers)
 * const headers = new Headers({ 'x-aqua-project-id': 'proj_123' });
 * const projectId2 = getProjectId(headers);
 * ```
 *
 * Notes:
 * - IncomingHttpHeaders values can be string | string[]; the first value is used when it's an array.
 * - Header name is case-insensitive in practice, but we query the canonical lowercase key.
 *
 * @param headers Request headers (Web Headers or IncomingHttpHeaders).
 * @returns Project ID if present; undefined otherwise.
 */
export const getProjectId = (headers?: Headers | IncomingHttpHeaders): string | undefined => {
	if (!headers) return undefined;

	// Determine if it's Headers or IncomingHttpHeaders
	const isWebHeaders = headers instanceof Headers;

	// Read header value
	let headerProjectId = isWebHeaders
		? headers.get(PROJECT_ID_HEADER)
		: headers[PROJECT_ID_HEADER];

	// Handle string[] value in IncomingHttpHeaders
	if (Array.isArray(headerProjectId)) {
		headerProjectId = headerProjectId[0];
	}

	return headerProjectId || undefined;
};
