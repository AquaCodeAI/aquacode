import { Injectable } from '@nestjs/common';
import { FilterCondition, FilterExpression } from './filter-parser.service';

/**
 * Converts FilterExpression to MongoDB query objects
 */
@Injectable()
export class FilterToMongoService {
	/**
	 * Converts a parsed filter expression to a MongoDB query
	 *
	 * @param expression - The parsed filter expression
	 * @param context - Context for resolving placeholders (user, session, etc.)
	 * @returns MongoDB query object
	 */
	toMongoQuery(
		expression: FilterExpression | null,
		context?: {
			user?: Record<string, any>;
			session?: Record<string, any>;
			[key: string]: any;
		},
	): Record<string, any> {
		if (!expression) {
			return {};
		}

		switch (expression.type) {
			case 'condition':
				return this.convertCondition(expression.condition!, context);

			case 'logical':
				return this.convertLogical(expression, context);

			case 'group':
				return this.convertGroup(expression, context);

			default:
				return {};
		}
	}

	/**
	 * Converts a single condition to a MongoDB query
	 */
	private convertCondition(
		condition: FilterCondition,
		context?: Record<string, any>,
	): Record<string, any> {
		const { attribute, operator, value } = condition;

		const resolvedValue = this.resolveValue(value, context);

		switch (operator) {
			case '=':
				return { [attribute]: resolvedValue };

			case '!=':
				return { [attribute]: { $ne: resolvedValue } };

			case '>':
				return { [attribute]: { $gt: resolvedValue } };

			case '>=':
				return { [attribute]: { $gte: resolvedValue } };

			case '<':
				return { [attribute]: { $lt: resolvedValue } };

			case '<=':
				return { [attribute]: { $lte: resolvedValue } };

			case 'CONTAINS':
				return { [attribute]: { $regex: this.escapeRegex(resolvedValue), $options: 'i' } };

			case 'STARTS WITH':
				return {
					[attribute]: { $regex: `^${this.escapeRegex(resolvedValue)}`, $options: 'i' },
				};

			case 'IN':
				return {
					[attribute]: {
						$in: Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue],
					},
				};

			case 'NOT IN':
				return {
					[attribute]: {
						$nin: Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue],
					},
				};

			case 'EXISTS':
				return { [attribute]: { $exists: true } };

			case 'NOT EXISTS':
				return { [attribute]: { $exists: false } };

			case 'IS NULL':
				return { [attribute]: null };

			case 'IS NOT NULL':
				return { [attribute]: { $ne: null } };

			case 'IS EMPTY':
				return {
					$or: [
						{ [attribute]: null },
						{ [attribute]: '' },
						{ [attribute]: [] },
						{ [attribute]: {} },
					],
				};

			case 'IS NOT EMPTY':
				return {
					[attribute]: {
						$exists: true,
						$nin: [null, '', []],
					},
				};

			case 'TO':
				if (Array.isArray(resolvedValue) && resolvedValue.length === 2) {
					return {
						[attribute]: {
							$gte: resolvedValue[0],
							$lte: resolvedValue[1],
						},
					};
				}
				return {};

			default:
				return {};
		}
	}

	/**
	 * Converts logical expression (AND, OR, NOT) to MongoDB query
	 */
	private convertLogical(
		expression: FilterExpression,
		context?: Record<string, any>,
	): Record<string, any> {
		const { operator, expressions } = expression;

		if (!expressions || expressions.length === 0) {
			return {};
		}

		const queries = expressions.map((expr) => this.toMongoQuery(expr, context));

		switch (operator) {
			case 'AND':
				return { $and: queries };

			case 'OR':
				return { $or: queries };

			case 'NOT':
				return { $nor: queries };

			default:
				return {};
		}
	}

	/**
	 * Converts group expression to MongoDB query
	 */
	private convertGroup(
		expression: FilterExpression,
		context?: Record<string, any>,
	): Record<string, any> {
		const { expressions } = expression;

		if (!expressions || expressions.length === 0) {
			return {};
		}

		const queries = expressions.map((expr) => this.toMongoQuery(expr, context));

		if (queries.length === 1) {
			return queries[0];
		}

		return { $and: queries };
	}

	/**
	 * Resolves context placeholders in values
	 * Examples: "user.id" -> actual user id, "session.tenantId" -> actual tenant id
	 */
	private resolveValue(value: any, context?: Record<string, any>): any {
		if (typeof value !== 'string') {
			return value;
		}

		if (!context) {
			return value;
		}

		const parts = value.split('.');
		if (parts.length > 1 && parts[0] in context) {
			const [root, ...path] = parts;
			let current = context[root];

			for (const key of path) {
				if (current === null || current === undefined) {
					return value;
				}
				current = current[key];
			}

			return current;
		}

		return value;
	}

	/**
	 * Escapes special regex characters
	 */
	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
