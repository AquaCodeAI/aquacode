import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Interface for exception response
 */
export interface ExceptionResponse {
	success: false;
	errors: string[];
	messages: string[];
}

/**
 * Interface for exception response objects from HttpException
 *
 * This interface handles responses from multiple sources:
 *
 * 1. Custom exceptions (our BaseException):
 *    { success: false, errors: [...], messages: [...] }
 *
 * 2. NestJS built-in exceptions:
 *    { message: "...", error: "Bad Request", statusCode: 400 }
 *
 * 3. class-validator validation errors:
 *    { message: ["email must be valid", "password is required"], error: "Bad Request" }
 *
 * 4. NestJS Guards (e.g., AuthGuard):
 *    { message: "Unauthorized", statusCode: 401 }
 *
 * 5. Third-party libraries (Passport, TypeORM, Mongoose, etc.):
 *    Various formats with message and/or error fields
 *
 * By supporting all these fields, we ensure consistent error responses
 * regardless of the exception source.
 */
interface ExceptionResponseObject {
	/** Our custom exception structure indicator */
	success?: boolean;
	/** Our custom exception errors array */
	errors?: string | string[];
	/** Our custom exception messages array */
	messages?: string | string[];
	/** NestJS built-in and third-party exception message */
	message?: string | string[];
	/** NestJS built-in exception error description */
	error?: string;
	/** Allow any other properties from various exception sources */
	[key: string]: unknown;
}

/**
 * Global HTTP exception filter
 *
 * This filter catches all exceptions thrown in the application and transforms them
 * into appropriate HTTP responses with the correct status codes.
 * - 4XX status codes are used for client errors (e.g., bad request, unauthorized)
 * - 5XX status codes are used for server errors (e.g., internal server error)
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		// Default to internal server error
		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let errorResponse: ExceptionResponse;

		if (exception instanceof HttpException) {
			// Handle NestJS HTTP exceptions
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			errorResponse = this.createErrorResponse(status, exceptionResponse, request);
		} else if (exception instanceof Error) {
			// Silence AbortError
			if (exception.name === 'AbortError') {
				return;
			}

			// Handle generic Error objects
			errorResponse = this.createErrorResponse(
				status,
				{
					message: exception.message || 'Internal server error',
					error: 'Internal Server Error',
				},
				request,
			);

			// Log stack trace for server errors
			this.logger.error(
				`${request.method} ${request.url}`,
				exception.stack,
				'HttpExceptionFilter',
			);
		} else {
			// Handle unknown exceptions
			errorResponse = this.createErrorResponse(
				status,
				{
					message: 'Internal server error',
					error: 'Internal Server Error',
				},
				request,
			);

			// Use a safer approach to stringify the exception
			let exceptionInfo: string;
			try {
				// Try to stringify with pretty-printing (2 spaces indentation)
				exceptionInfo = JSON.stringify(exception, null, 2);
			} catch {
				// If JSON.stringify fails (e.g., circular references), provide a more helpful message
				exceptionInfo =
					'Unable to stringify error object. It may contain circular references or complex data structures.';
			}

			this.logger.error(
				`${request.method} ${request.url}`,
				exceptionInfo,
				'HttpExceptionFilter',
			);
		}

		response.status(status).json(errorResponse);
	}

	/**
	 * Creates a standardized error response from various exception formats
	 *
	 * This method acts as a normalization layer that transforms exceptions from
	 * different sources into our consistent response structure:
	 * { success: false, errors: [...], messages: [...] }
	 *
	 * @param status HTTP status code
	 * @param exceptionResponse Response object from the exception
	 * @param request Express request object for logging
	 * @returns Standardized ExceptionResponse
	 */
	private createErrorResponse(
		status: HttpStatus,
		exceptionResponse: string | object,
		request: Request,
	): ExceptionResponse {
		// Default values
		let errors: string[];
		let messages: string[] = [];

		if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
			// Cast to our interface for type safety
			const typedResponse = exceptionResponse as ExceptionResponseObject;

			// Check if the response already has the new structure
			if (typedResponse.success === false && typedResponse.errors) {
				// Response from our custom exceptions (BaseException)
				// Structure: { success: false, errors: [...], messages: [...] }
				errors = this.normalizeToArray(typedResponse.errors);
				messages = this.normalizeToArray(typedResponse.messages || []);
			} else {
				// Response from NestJS built-in exceptions or other sources
				// Possible structures:
				// - { message: "...", error: "Bad Request" }
				// - { message: ["error1", "error2"], error: "Bad Request" }
				// - { message: "Unauthorized" }

				// Try to extract from message or error fields
				const rawMessage = typedResponse.message || typedResponse.error;
				errors = this.normalizeToArray(rawMessage || 'An error occurred');
			}
		} else if (exceptionResponse === null || exceptionResponse === undefined) {
			errors = ['An error occurred'];
		} else {
			// For primitive types, safely convert to string
			errors = [String(exceptionResponse)];
		}

		// Log request information for debugging
		this.logger.debug(
			`Error on ${request.method} ${request.url}: ${errors.join(', ')} (Status: ${status})`,
		);

		// Create the standardized error response
		return {
			success: false,
			errors,
			messages,
		};
	}

	/**
	 * Normalize input to a string array
	 *
	 * Handles various input formats and converts them to a consistent string array:
	 * - undefined/null -> []
	 * - string -> [string]
	 * - string[] -> string[]
	 *
	 * @param input Value to normalize
	 * @returns Normalized string array
	 */
	private normalizeToArray(input: string | string[] | undefined): string[] {
		if (!input) {
			return [];
		}
		if (Array.isArray(input)) {
			return input;
		}
		return [String(input)];
	}
}
