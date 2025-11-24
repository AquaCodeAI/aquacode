import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base response interface for errors
 */
export interface BaseResponseInterface {
	success: boolean;
	errors: string[];
	messages: string[];
}

/**
 * Exception response interface with a strict success type
 */
export interface ExceptionResponseInterface extends Omit<BaseResponseInterface, 'success'> {
	success: false;
}

/**
 * Base custom exception class
 *
 * This class extends the NestJS HttpException class and provides a base
 * for all custom exceptions in the application. It ensures a consistent
 * structure for all exception responses.
 */
export class BaseException extends HttpException {
	/**
	 * Creates a new BaseException instance
	 *
	 * @param message Error message or array of error messages
	 * @param status HTTP status code
	 * @param additionalMessages Optional additional informational messages
	 */
	constructor(message: string | string[], status: HttpStatus, additionalMessages: string[] = []) {
		// Ensure errors is always an array
		const errors = Array.isArray(message) ? message : [message];

		const response: ExceptionResponseInterface = {
			success: false,
			errors: errors,
			messages: additionalMessages,
		};

		super(response, status);
	}
}
