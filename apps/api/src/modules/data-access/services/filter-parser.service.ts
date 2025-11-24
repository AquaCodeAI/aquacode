/**
 * FilterParserService
 *
 * Filter query expressions that convert string-based filter queries
 * into structured FilterExpression objects.
 *
 * @example
 * ```TypeScript
 * const query = "age >= 18 AND status = 'active'";
 * const expression = FilterParserService.parse(query);
 * ```
 */
export type FilterOperator =
	| '='
	| '!='
	| '>'
	| '>='
	| '<'
	| '<='
	| 'TO'
	| 'EXISTS'
	| 'NOT EXISTS'
	| 'IN'
	| 'NOT IN'
	| 'IS EMPTY'
	| 'IS NOT EMPTY'
	| 'IS NULL'
	| 'IS NOT NULL'
	| 'CONTAINS'
	| 'STARTS WITH';

export interface FilterCondition {
	attribute: string;
	operator: FilterOperator;
	value?: any;
}

export interface FilterExpression {
	type: 'condition' | 'group' | 'logical';
	condition?: FilterCondition;
	operator?: 'AND' | 'OR' | 'NOT';
	expressions?: FilterExpression[];
}

/**
 * Custom error class for filter parsing errors
 */
export class FilterParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FilterParseError';
		Object.setPrototypeOf(this, FilterParseError.prototype);
	}
}

export class FilterParserService {
	private static readonly MAX_QUERY_LENGTH = 10000;

	private static readonly OPERATORS: readonly FilterOperator[] = [
		'STARTS WITH',
		'IS NOT EMPTY',
		'IS EMPTY',
		'IS NOT NULL',
		'IS NULL',
		'NOT EXISTS',
		'EXISTS',
		'CONTAINS',
		'NOT IN',
		'IN',
		'TO',
		'!=',
		'>=',
		'<=',
		'=',
		'>',
		'<',
	] as const;

	private static readonly LOGICAL_OPERATORS = ['AND', 'OR', 'NOT'] as const;

	/**
	 * Parses a filter query string into a FilterExpression object
	 *
	 * @param filterQuery - The filter query string to parse
	 * @returns Parsed FilterExpression or null if query is empty
	 * @throws {FilterParseError} If the query is invalid or malformed
	 *
	 * @example
	 * ```TypeScript
	 * // Simple condition
	 * FilterParserService.parse("age >= 18");
	 *
	 * // Complex condition with logical operators
	 * FilterParserService.parse("(age >= 18 AND status = 'active') OR verified = true");
	 *
	 * // Using IN operator with arrays
	 * FilterParserService.parse("category IN ['tech','science']");
	 * ```
	 */
	static parse(filterQuery: string): FilterExpression | null {
		if (filterQuery === null || filterQuery === undefined) {
			throw new FilterParseError('Filter query cannot be null or undefined');
		}

		if (filterQuery.trim() === '') {
			return null;
		}

		if (filterQuery.length > this.MAX_QUERY_LENGTH) {
			throw new FilterParseError(
				`Filter query exceeds maximum length of ${this.MAX_QUERY_LENGTH} characters (received length: ${filterQuery.length})`,
			);
		}

		try {
			const tokens = this.tokenize(filterQuery);

			if (tokens.length === 0) {
				return null;
			}

			return this.parseTokens(tokens, filterQuery);
		} catch (error) {
			if (error instanceof FilterParseError) {
				throw error;
			}
			throw new FilterParseError(
				`Unexpected error while parsing filter query: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	/**
	 * Tokenizes the filter query string into an array of tokens
	 */
	private static tokenize(query: string): string[] {
		const tokens: string[] = [];
		let current = '';
		let inQuotes = false;
		let quoteChar = '';
		let inBrackets = false;

		for (let i = 0; i < query.length; i++) {
			const char = query[i];

			if ((char === '"' || char === "'") && !inQuotes) {
				inQuotes = true;
				quoteChar = char;
				current += char;
			} else if (char === quoteChar && inQuotes) {
				inQuotes = false;
				current += char;
				quoteChar = '';
			} else if (char === '[' && !inQuotes) {
				inBrackets = true;
				current += char;
			} else if (char === ']' && !inQuotes) {
				inBrackets = false;
				current += char;
			} else if (char === '(' && !inQuotes) {
				if (current.trim()) {
					tokens.push(current.trim());
					current = '';
				}
				tokens.push('(');
			} else if (char === ')' && !inQuotes) {
				if (current.trim()) {
					tokens.push(current.trim());
					current = '';
				}
				tokens.push(')');
			} else if (char === ' ' && !inQuotes && !inBrackets) {
				if (current.trim()) {
					tokens.push(current.trim());
					current = '';
				}
			} else {
				current += char;
			}
		}

		if (current.trim()) {
			tokens.push(current.trim());
		}

		if (inQuotes) {
			throw new FilterParseError(
				`Unclosed quote in filter query. Expected closing ${quoteChar}`,
			);
		}

		const openBrackets = tokens.filter((t) => t.includes('[') && !t.includes(']')).length;
		const closeBrackets = tokens.filter((t) => t.includes(']') && !t.includes('[')).length;
		if (openBrackets !== closeBrackets) {
			throw new FilterParseError(
				`Unbalanced brackets in filter query. Open: ${openBrackets}, Close: ${closeBrackets}`,
			);
		}

		return tokens;
	}

	/**
	 * Parses tokens into a FilterExpression structure using the Shunting Yard algorithm
	 */
	private static parseTokens(tokens: string[], originalQuery: string): FilterExpression {
		const output: (FilterExpression | string)[] = [];
		const operators: string[] = [];

		let i = 0;
		while (i < tokens.length) {
			const token = tokens[i];

			if (token === '(') {
				operators.push(token);
				i++;
			} else if (token === ')') {
				while (operators.length > 0 && operators[operators.length - 1] !== '(') {
					this.popOperator(operators, output, originalQuery);
				}

				if (operators.length === 0) {
					throw new FilterParseError(
						`Unbalanced parentheses: found ')' at token index ${i} without matching '(' in query: ${originalQuery}`,
					);
				}

				operators.pop();
				i++;
			} else if (this.LOGICAL_OPERATORS.includes(token.toUpperCase() as any)) {
				const upperToken = token.toUpperCase();
				while (
					operators.length > 0 &&
					operators[operators.length - 1] !== '(' &&
					this.getPrecedence(operators[operators.length - 1]) >=
						this.getPrecedence(upperToken)
				) {
					this.popOperator(operators, output, originalQuery);
				}
				operators.push(upperToken);
				i++;
			} else {
				try {
					const condition = this.parseCondition(tokens, i, originalQuery);
					output.push({
						type: 'condition',
						condition: condition.condition,
					});
					i = condition.nextIndex;
				} catch (error) {
					if (error instanceof FilterParseError) {
						throw error;
					}
					throw new FilterParseError(
						`Failed to parse condition at token index ${i} (token: "${token}"). Query: ${originalQuery}`,
					);
				}
			}
		}

		while (operators.length > 0) {
			const op = operators[operators.length - 1];
			if (op === '(') {
				throw new FilterParseError(
					`Unbalanced parentheses: found '(' without matching ')' in query: ${originalQuery}`,
				);
			}
			this.popOperator(operators, output, originalQuery);
		}

		if (output.length === 0) {
			throw new FilterParseError(`Empty filter expression for query: ${originalQuery}`);
		}

		return output.length === 1 && typeof output[0] !== 'string'
			? output[0]
			: { type: 'group', expressions: output as FilterExpression[] };
	}

	/**
	 * Parses an individual filter condition
	 */
	private static parseCondition(
		tokens: string[],
		startIndex: number,
		originalQuery: string,
	): { condition: FilterCondition; nextIndex: number } {
		let i = startIndex;

		if (i >= tokens.length) {
			throw new FilterParseError(
				`Expected attribute at token index ${i} in query: ${originalQuery}`,
			);
		}

		const attribute = this.cleanValue(tokens[i]);

		if (!attribute || typeof attribute !== 'string') {
			throw new FilterParseError(
				`Invalid attribute at token index ${i}: "${tokens[i]}". Query: ${originalQuery}`,
			);
		}

		i++;

		let operator = '';
		let operatorTokens = 0;

		for (const op of this.OPERATORS) {
			const opParts = op.split(' ');
			let matches = true;

			for (let j = 0; j < opParts.length; j++) {
				if (i + j >= tokens.length || tokens[i + j].toUpperCase() !== opParts[j]) {
					matches = false;
					break;
				}
			}

			if (matches) {
				operator = op;
				operatorTokens = opParts.length;
				break;
			}
		}

		if (!operator) {
			const availableOps = Array.from(this.OPERATORS).slice(0, 5).join(', ');
			throw new FilterParseError(
				`Invalid or missing operator at token index ${i} (token: "${tokens[i]}"). Expected one of: ${availableOps}... Query: ${originalQuery}`,
			);
		}

		i += operatorTokens;

		const noValueOperators = [
			'EXISTS',
			'NOT EXISTS',
			'IS EMPTY',
			'IS NOT EMPTY',
			'IS NULL',
			'IS NOT NULL',
		];

		let value: any = undefined;

		if (!noValueOperators.includes(operator)) {
			if (i >= tokens.length) {
				throw new FilterParseError(
					`Missing value for operator '${operator}' at token index ${i} in query: ${originalQuery}`,
				);
			}

			const valueToken = tokens[i];

			if (valueToken.startsWith('[') && valueToken.endsWith(']')) {
				const arrayContent = valueToken.slice(1, -1).trim();

				if (arrayContent === '') {
					throw new FilterParseError(
						`Empty array value at token index ${i} (token: "${valueToken}") in query: ${originalQuery}`,
					);
				}

				value = arrayContent.split(',').map((v) => this.cleanValue(v.trim()));
			} else {
				value = this.cleanValue(valueToken);
			}

			i++;
		}

		return {
			condition: { attribute, operator: operator as FilterOperator, value },
			nextIndex: i,
		};
	}

	/**
	 * Cleans a value by removing quotes and converting types
	 */
	private static cleanValue(value: string): any {
		if (!value) return value;

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			return value.slice(1, -1);
		}

		const num = Number(value);
		if (!isNaN(num) && value !== '') {
			return num;
		}

		if (value.toLowerCase() === 'true') return true;
		if (value.toLowerCase() === 'false') return false;
		if (value.toLowerCase() === 'null') return null;

		return value;
	}

	/**
	 * Gets the precedence of a logical operator
	 */
	private static getPrecedence(operator: string): number {
		switch (operator.toUpperCase()) {
			case 'NOT':
				return 3;
			case 'AND':
				return 2;
			case 'OR':
				return 1;
			default:
				return 0;
		}
	}

	/**
	 * Processes an operator from the stack
	 */
	private static popOperator(
		operators: string[],
		output: (FilterExpression | string)[],
		originalQuery: string,
	): void {
		const operator = operators.pop();

		if (!operator || !this.LOGICAL_OPERATORS.includes(operator as any)) {
			return;
		}

		if (operator === 'NOT') {
			if (output.length === 0) {
				throw new FilterParseError(
					`NOT operator requires an operand. Query: ${originalQuery}`,
				);
			}

			const operand = output.pop() as FilterExpression;
			output.push({
				type: 'logical',
				operator: 'NOT',
				expressions: [operand],
			});
		} else {
			if (output.length < 2) {
				throw new FilterParseError(
					`${operator} operator requires two operands. Query: ${originalQuery}`,
				);
			}

			const right = output.pop() as FilterExpression;
			const left = output.pop() as FilterExpression;
			output.push({
				type: 'logical',
				operator: operator as 'AND' | 'OR',
				expressions: [left, right],
			});
		}
	}
}
