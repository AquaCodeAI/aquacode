import { Injectable } from '@nestjs/common';
import { BadRequestException, ConnectionSchemaItem } from '@aquacode/common';

export interface ValidationError {
	field: string;
	errors: string[];
}

@Injectable()
export class SchemaValidatorService {
	/**
	 * Validates data against a connection schema
	 */
	validate(data: Record<string, any>, schema: ConnectionSchemaItem): ValidationError[] {
		const errors: ValidationError[] = [];

		// Validate required fields
		for (const field of schema.fields) {
			const value = data[field.name];
			const fieldErrors: string[] = [];

			// Check required
			if (field.required && (value === undefined || value === null || value === '')) {
				fieldErrors.push(`Field '${field.name}' is required`);
			}

			// If value exists, validate type
			if (value !== undefined && value !== null) {
				const typeError = this.validateType(value, field.type, field.name);
				if (typeError) {
					fieldErrors.push(typeError);
				}
			}

			if (fieldErrors.length > 0) {
				errors.push({ field: field.name, errors: fieldErrors });
			}
		}

		// Check for extra fields not in the schema
		const schemaFieldNames = schema.fields.map((f) => f.name);
		const extraFields = Object.keys(data).filter(
			(key) =>
				!schemaFieldNames.includes(key) &&
				!key.startsWith('__c') &&
				!key.startsWith('__s') &&
				key !== '_id',
		);

		if (extraFields.length > 0) {
			errors.push({
				field: '_extra',
				errors: [`Unexpected fields: ${extraFields.join(', ')}`],
			});
		}

		return errors;
	}

	/**
	 * Validates and throws exception if validation fails
	 */
	validateOrThrow(data: Record<string, any>, schema: ConnectionSchemaItem): void {
		const errors = this.validate(data, schema);
		if (errors.length > 0) {
			const errorMessages = errors.flatMap((error) =>
				error.errors.map((msg) => `${error.field}: ${msg}`),
			);
			throw new BadRequestException({ errors: errorMessages });
		}
	}

	/**
	 * Applies default values from schema to data
	 */
	applyDefaults(data: Record<string, any>, schema: ConnectionSchemaItem): Record<string, any> {
		const result = { ...data };

		for (const field of schema.fields) {
			if (result[field.name] === undefined && field.default !== undefined) {
				// Handle special default values
				if (field.default === 'Date.now') {
					result[field.name] = new Date();
				} else {
					result[field.name] = field.default;
				}
			}

			// Apply trim if specified
			if (field.trim && typeof result[field.name] === 'string') {
				result[field.name] = result[field.name].trim();
			}
		}

		return result;
	}

	private validateType(value: any, type: string, fieldName: string): string | null {
		switch (type) {
			case 'String':
				if (typeof value !== 'string') {
					return `Field '${fieldName}' must be a string`;
				}
				break;

			case 'Number':
				if (typeof value !== 'number' || isNaN(value)) {
					return `Field '${fieldName}' must be a number`;
				}
				break;

			case 'Boolean':
				if (typeof value !== 'boolean') {
					return `Field '${fieldName}' must be a boolean`;
				}
				break;

			case 'Date':
				if (!(value instanceof Date) && !this.isValidDateString(value)) {
					return `Field '${fieldName}' must be a valid date`;
				}
				break;

			case 'Array':
				if (!Array.isArray(value)) {
					return `Field '${fieldName}' must be an array`;
				}
				break;

			case 'Object':
				if (typeof value !== 'object' || Array.isArray(value)) {
					return `Field '${fieldName}' must be an object`;
				}
				break;

			default:
				// Custom types or unknown types
				break;
		}

		return null;
	}

	private isValidDateString(value: any): boolean {
		if (typeof value !== 'string') return false;
		const date = new Date(value);
		return !isNaN(date.getTime());
	}
}
