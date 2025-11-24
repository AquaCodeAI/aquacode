import { Injectable } from '@nestjs/common';
import { FilterCondition, FilterExpression } from './filter-parser.service';

/**
 * FilterEvaluatorService
 *
 * Evaluates parsed filter expressions against data objects.
 * Works together with FilterParserService to provide complete filtering functionality.
 *
 * @example
 * ```TypeScript
 * const expression = FilterParserService.parse("age >= 18 AND status = 'active'");
 * const canAccess = await FilterEvaluatorService.evaluate(expression, document, user, session);
 * ```
 */
@Injectable()
export class FilterEvaluatorService {
	/**
	 * Evaluates a filter expression against a data object
	 *
	 * @param expression - The parsed filter expression to evaluate
	 * @param data - The data object to evaluate against
	 * @param context - Optional context (user, session, etc.) for attribute resolution
	 * @returns True if the expression matches, false otherwise
	 */
	evaluate(
		expression: FilterExpression | null,
		data: Record<string, any>,
		context?: {
			user?: Record<string, any>;
			session?: Record<string, any>;
			[key: string]: any;
		},
	): boolean {
		if (!expression) {
			return true;
		}

		switch (expression.type) {
			case 'condition':
				return this.evaluateCondition(expression.condition!, data, context);

			case 'logical':
				return this.evaluateLogical(expression, data, context);

			case 'group':
				return this.evaluateGroup(expression, data, context);

			default:
				return false;
		}
	}

	/**
	 * Resolves a value that might be a context reference or a literal
	 * Examples:
	 * - "user._id" -> context.user._id value
	 * - "session.tenantId" -> context.session.tenantId value
	 * - "active" -> "active" (literal string)
	 * - 123 -> 123 (literal number)
	 */
	private resolveValueOrLiteral(value: any, context?: Record<string, any>): any {
		if (typeof value !== 'string') {
			return value;
		}

		if (value.includes('.')) {
			const [root, ...path] = value.split('.');

			if (context && (root === 'user' || root === 'session') && root in context) {
				return this.getNestedValue(context[root], path);
			}
		}

		return value;
	}

	/**
	 * Evaluates a single condition
	 */
	private evaluateCondition(
		condition: FilterCondition,
		data: Record<string, any>,
		context?: Record<string, any>,
	): boolean {
		const { attribute, operator, value } = condition;

		const actualValue = this.resolveAttribute(attribute, data, context);

		const resolvedValue = this.resolveValueOrLiteral(value, context);

		switch (operator) {
			case '=':
				return actualValue == resolvedValue;

			case '!=':
				return actualValue != resolvedValue;

			case '>':
				return actualValue > resolvedValue;

			case '>=':
				return actualValue >= resolvedValue;

			case '<':
				return actualValue < resolvedValue;

			case '<=':
				return actualValue <= resolvedValue;

			case 'CONTAINS':
				return typeof actualValue === 'string' && actualValue.includes(resolvedValue);

			case 'STARTS WITH':
				return typeof actualValue === 'string' && actualValue.startsWith(resolvedValue);

			case 'IN':
				return Array.isArray(resolvedValue) && resolvedValue.includes(actualValue);

			case 'NOT IN':
				return Array.isArray(resolvedValue) && !resolvedValue.includes(actualValue);

			case 'EXISTS':
				return actualValue !== undefined;

			case 'NOT EXISTS':
				return actualValue === undefined;

			case 'IS NULL':
				return actualValue === null;

			case 'IS NOT NULL':
				return actualValue !== null;

			case 'IS EMPTY':
				return this.isEmpty(actualValue);

			case 'IS NOT EMPTY':
				return !this.isEmpty(actualValue);

			default:
				return false;
		}
	}

	/**
	 * Evaluates a logical expression (AND, OR, NOT)
	 */
	private evaluateLogical(
		expression: FilterExpression,
		data: Record<string, any>,
		context?: Record<string, any>,
	): boolean {
		const { operator, expressions } = expression;

		if (!expressions || expressions.length === 0) {
			return false;
		}

		switch (operator) {
			case 'AND': {
				for (const expr of expressions) {
					const result = this.evaluate(expr, data, context);
					if (!result) {
						return false;
					}
				}
				return true;
			}

			case 'OR': {
				for (const expr of expressions) {
					const result = this.evaluate(expr, data, context);
					if (result) {
						return true;
					}
				}
				return false;
			}

			case 'NOT': {
				const result = this.evaluate(expressions[0], data, context);
				return !result;
			}

			default:
				return false;
		}
	}

	/**
	 * Evaluates a group expression
	 */
	private evaluateGroup(
		expression: FilterExpression,
		data: Record<string, any>,
		context?: Record<string, any>,
	): boolean {
		const { expressions } = expression;

		if (!expressions || expressions.length === 0) {
			return false;
		}

		for (const expr of expressions) {
			const result = this.evaluate(expr, data, context);
			if (!result) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Resolves an attribute value from data or context
	 * Supports nested paths like 'user.email' or 'session.userId'
	 */
	private resolveAttribute(
		attribute: string,
		data: Record<string, any>,
		context?: Record<string, any>,
	): any {
		if (attribute.includes('.')) {
			const [root, ...path] = attribute.split('.');

			if (context && root in context) {
				return this.getNestedValue(context[root], path);
			}

			if (root in data) {
				return this.getNestedValue(data[root], path);
			}

			return undefined;
		}

		if (context && attribute in context) {
			return context[attribute];
		}

		return data[attribute];
	}

	/**
	 * Gets a nested value from an object using a path array
	 */
	private getNestedValue(obj: any, path: string[]): any {
		let current = obj;

		for (const key of path) {
			if (current === null || current === undefined) {
				return undefined;
			}
			current = current[key];
		}

		return current;
	}

	/**
	 * Checks if a value is considered empty
	 */
	private isEmpty(value: any): boolean {
		if (value === null || value === undefined) {
			return true;
		}

		if (typeof value === 'string') {
			return value.trim() === '';
		}

		if (Array.isArray(value)) {
			return value.length === 0;
		}

		if (typeof value === 'object') {
			return Object.keys(value).length === 0;
		}

		return false;
	}
}
