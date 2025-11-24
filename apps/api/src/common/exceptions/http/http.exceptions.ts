import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

/**
 * Exception options interface
 */
export interface ExceptionOptions {
	errors?: string | string[];
	messages?: string[];
}

/**
 * Bad Request Exception (400)
 *
 * Used when the client sends a request with invalid data or parameters.
 */
export class BadRequestException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Bad Request', HttpStatus.BAD_REQUEST, options?.messages);
	}
}

/**
 * Unauthorized Exception (401)
 *
 * Used when authentication is required but not provided or invalid.
 */
export class UnauthorizedException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Unauthorized', HttpStatus.UNAUTHORIZED, options?.messages);
	}
}

/**
 * Forbidden Exception (403)
 *
 * Used when the client doesn't have permission to access the requested resource.
 */
export class ForbiddenException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Forbidden', HttpStatus.FORBIDDEN, options?.messages);
	}
}

/**
 * Not Found Exception (404)
 *
 * Used when the requested resource doesn't exist.
 */
export class NotFoundException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Not Found', HttpStatus.NOT_FOUND, options?.messages);
	}
}

/**
 * Method Not Allowed Exception (405)
 *
 * Used when the HTTP method is not allowed for the requested resource.
 */
export class MethodNotAllowedException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(
			options?.errors || 'Method Not Allowed',
			HttpStatus.METHOD_NOT_ALLOWED,
			options?.messages,
		);
	}
}

/**
 * Request Timeout Exception (408)
 *
 * Used when a request to the server takes longer than the server's wait time.
 */
export class RequestTimeoutException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Request Timeout', HttpStatus.REQUEST_TIMEOUT, options?.messages);
	}
}

/**
 * Conflict Exception (409)
 *
 * Used when the request conflicts with the current state of the server.
 */
export class ConflictException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Conflict', HttpStatus.CONFLICT, options?.messages);
	}
}

/**
 * Unprocessable Entity Exception (422)
 *
 * Used when the server understands the content type but can't process the request.
 */
export class UnprocessableEntityException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(
			options?.errors || 'Unprocessable Entity',
			HttpStatus.UNPROCESSABLE_ENTITY,
			options?.messages,
		);
	}
}

/**
 * Too Many Requests Exception (429)
 *
 * Used when the client has sent too many requests in a given amount of time.
 */
export class TooManyRequestsException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(
			options?.errors || 'Too Many Requests',
			HttpStatus.TOO_MANY_REQUESTS,
			options?.messages,
		);
	}
}

/**
 * Internal Server Error Exception (500)
 *
 * Used when an unexpected error occurs on the server.
 */
export class InternalServerErrorException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(
			options?.errors || 'Internal Server Error',
			HttpStatus.INTERNAL_SERVER_ERROR,
			options?.messages,
		);
	}
}

/**
 * Not Implemented Exception (501)
 *
 * Used when the server does not support the functionality required to fulfill the request.
 */
export class NotImplementedException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Not Implemented', HttpStatus.NOT_IMPLEMENTED, options?.messages);
	}
}

/**
 * Bad Gateway Exception (502)
 *
 * Used when the server, while acting as a gateway or proxy, received an invalid response from the upstream server.
 */
export class BadGatewayException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Bad Gateway', HttpStatus.BAD_GATEWAY, options?.messages);
	}
}

/**
 * Service Unavailable Exception (503)
 *
 * Used when the server is not ready to handle the request, often due to maintenance or overload.
 */
export class ServiceUnavailableException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(
			options?.errors || 'Service Unavailable',
			HttpStatus.SERVICE_UNAVAILABLE,
			options?.messages,
		);
	}
}

/**
 * Gateway Timeout Exception (504)
 *
 * Used when the server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.
 */
export class GatewayTimeoutException extends BaseException {
	constructor(options?: ExceptionOptions) {
		super(options?.errors || 'Gateway Timeout', HttpStatus.GATEWAY_TIMEOUT, options?.messages);
	}
}
