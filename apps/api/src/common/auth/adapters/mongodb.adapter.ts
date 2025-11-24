import { createAdapterFactory } from 'better-auth/adapters';
import { Connection } from 'mongoose';

interface CleanedWhere {
	/**
	 * Field name in MongoDB (after any key mapping, e.g. "id" → "_id").
	 */
	field: string;

	/**
	 * Logical operator to apply to `value`.
	 *
	 * - eq        → field = value
	 * - ne        → field != value
	 * - lt / lte  → field < / <= value
	 * - gt / gte  → field > / >= value
	 * - in        → field ∈ value[]
	 * - not_in    → field ∉ value[]
	 * - contains      → field matches /value/i
	 * - starts_with   → field matches /^value/i
	 * - ends_with     → field matches /value$/i
	 */
	operator?:
		| 'eq'
		| 'ne'
		| 'lt'
		| 'lte'
		| 'gt'
		| 'gte'
		| 'in'
		| 'not_in'
		| 'contains'
		| 'starts_with'
		| 'ends_with';

	/**
	 * Value to compare against.
	 * - For `in` / `not_in`, this must be an array.
	 * - For text operators, this must be a string.
	 */
	value: unknown;

	/**
	 * Connector to the *next* condition in the array.
	 *
	 * - "AND" (default) keeps building the current AND group.
	 * - "OR" closes the current AND group (if any) and starts a new group,
	 *   which is combined using MongoDB's `$or`.
	 *
	 * Grouping strategy:
	 *   Consecutive AND-connected conditions are grouped together in a single object.
	 *   These groups are then combined with `$or`.
	 */
	connector?: 'AND' | 'OR';
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Converts a linear list of conditions (`CleanedWhere[]`) into a MongoDB filter object.
 *
 * Combination model:
 * - The conditions are processed in order.
 * - Conditions with connector "AND" (or no connector) are accumulated in the current AND group.
 * - When a condition with connector "OR" is encountered:
 *     - The current AND group (if non-empty) is pushed into an `$or` array.
 *     - The OR condition itself is pushed as another element in that `$or` array.
 * - At the end:
 *     - If only AND was used, the result is a flat object:
 *         { field1: cond1, field2: cond2, ... }
 *     - If any OR was used, the result is:
 *         { $or: [ { ...andGroup1 }, { ...andGroup2 }, ... ] }
 *
 * Known limitations:
 * - Does not support arbitrary nesting of (AND/OR) or explicit parentheses.
 * - Implements a single “layer” of `$or` between AND groups, which is enough
 *   for many simple query use cases.
 *
 * Validation:
 * - `in` / `not_in` require an array value.
 * - Text operators (`contains`, `starts_with`, `ends_with`) require a string value
 *   and safely escape it for use in a MongoDB regex.
 * - Unknown operators cause an error to be thrown.
 */
const convertWhereToMongoFilter = (where: CleanedWhere[]): Record<string, unknown> => {
	if (!where || where.length === 0) {
		return {};
	}

	const filter: Record<string, unknown> = {};
	const orConditions: Record<string, unknown>[] = [];
	let currentAndGroup: Record<string, unknown> = {};

	for (const condition of where) {
		const { field, operator = 'eq', value, connector = 'AND' } = condition;

		let fieldCondition: unknown;

		switch (operator) {
			case 'eq':
				fieldCondition = value;
				break;
			case 'ne':
				fieldCondition = { $ne: value };
				break;
			case 'lt':
				fieldCondition = { $lt: value };
				break;
			case 'lte':
				fieldCondition = { $lte: value };
				break;
			case 'gt':
				fieldCondition = { $gt: value };
				break;
			case 'gte':
				fieldCondition = { $gte: value };
				break;
			case 'in':
				if (!Array.isArray(value)) {
					throw new Error(`Operator "in" expects an array value for field "${field}"`);
				}
				fieldCondition = { $in: value };
				break;
			case 'not_in':
				if (!Array.isArray(value)) {
					throw new Error(
						`Operator "not_in" expects an array value for field "${field}"`,
					);
				}
				fieldCondition = { $nin: value };
				break;
			case 'contains': {
				if (typeof value !== 'string') {
					throw new Error(
						`Operator "contains" expects a string value for field "${field}"`,
					);
				}
				const escaped = escapeRegex(value);
				fieldCondition = { $regex: escaped, $options: 'i' };
				break;
			}
			case 'starts_with': {
				if (typeof value !== 'string') {
					throw new Error(
						`Operator "starts_with" expects a string value for field "${field}"`,
					);
				}
				const escaped = escapeRegex(value);
				fieldCondition = { $regex: `^${escaped}`, $options: 'i' };
				break;
			}
			case 'ends_with': {
				if (typeof value !== 'string') {
					throw new Error(
						`Operator "ends_with" expects a string value for field "${field}"`,
					);
				}
				const escaped = escapeRegex(value);
				fieldCondition = { $regex: `${escaped}$`, $options: 'i' };
				break;
			}
			default:
				throw new Error(`Unsupported operator "${operator}" for field "${field}"`);
		}

		if (connector === 'OR') {
			if (Object.keys(currentAndGroup).length > 0) {
				orConditions.push(currentAndGroup);
				currentAndGroup = {};
			}
			orConditions.push({ [field]: fieldCondition });
		} else {
			currentAndGroup[field] = fieldCondition;
		}
	}

	if (Object.keys(currentAndGroup).length > 0) {
		if (orConditions.length > 0) {
			orConditions.push(currentAndGroup);
		} else {
			Object.assign(filter, currentAndGroup);
		}
	}

	if (orConditions.length > 0) {
		filter.$or = orConditions;
	}

	return filter;
};

/**
 * MongoDB adapter for better-auth.
 *
 * `db` expectations:
 * - `db` is expected to be compatible with the official MongoDB driver,
 *   it exposes `collection(name)` and the returned collection supports:
 *   `find`, `findOne`, `insertOne`, `updateMany`, `findOneAndUpdate`,
 *   `deleteOne`, `deleteMany`, `countDocuments`, etc.
 *
 * Key mapping:
 * - Input: `id` is mapped to `_id`.
 * - Output: `_id` is mapped back to `id`.
 *
 * Filtering:
 * - Methods that accept a `where` clause (`findOne`, `findMany`, `update`,
 *   `updateMany`, `delete`, `deleteMany`, `count`) convert it to a MongoDB
 *   filter using `convertWhereToMongoFilter` before querying the database.
 */
export const mongoTenantAdapter = (config: { db: NonNullable<Connection['db']> }) => {
	const { db } = config;

	return createAdapterFactory({
		config: {
			adapterId: 'mongodb-adapter',
			adapterName: 'mongodb-adapter',
			supportsJSON: true,
			supportsDates: true,
			supportsBooleans: true,
			supportsNumericIds: false,
			usePlural: true,
			mapKeysTransformInput: {
				id: '_id',
			},
			mapKeysTransformOutput: {
				_id: 'id',
			},
		},
		adapter: () => {
			return {
				create: async <T extends Record<string, any>>({ model, data }): Promise<T> => {
					const transformedData = { ...data };
					const result = await db.collection(model).insertOne(transformedData);
					return { ...transformedData, _id: result.insertedId } as T;
				},
				findOne: async <T>({ model, where }): Promise<T | null> => {
					const filter = convertWhereToMongoFilter(where);
					return (await db.collection(model).findOne(filter)) as T | null;
				},
				findMany: async <T>({ model, where, limit, sortBy, offset }): Promise<T[]> => {
					const filter = convertWhereToMongoFilter(where);
					let query = db.collection(model).find(filter);

					if (sortBy) {
						const sortDirection = sortBy.direction === 'desc' ? -1 : 1;
						query = query.sort({ [sortBy.field]: sortDirection });
					}

					if (offset !== undefined && offset !== null) {
						query = query.skip(offset);
					}

					query = query.limit(limit);

					return query.toArray() as Promise<T[]>;
				},
				update: async <T>({ model, where, update }): Promise<T | null> => {
					const filter = convertWhereToMongoFilter(where);
					const result = await db
						.collection(model)
						.findOneAndUpdate(filter, { $set: update }, { returnDocument: 'after' });
					return result as T | null;
				},
				updateMany: async ({ model, where, update }) => {
					const filter = convertWhereToMongoFilter(where);
					const result = await db.collection(model).updateMany(filter, { $set: update });
					return result.modifiedCount;
				},
				delete: async ({ model, where }) => {
					const filter = convertWhereToMongoFilter(where);
					await db.collection(model).deleteOne(filter);
				},
				deleteMany: async ({ model, where }) => {
					const filter = convertWhereToMongoFilter(where);
					const result = await db.collection(model).deleteMany(filter);
					return result.deletedCount;
				},
				count: async ({ model, where }) => {
					const filter = convertWhereToMongoFilter(where || []);
					return await db.collection(model).countDocuments(filter);
				},
			};
		},
	});
};
