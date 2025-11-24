import { ulid } from 'ulid';

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier).
 * Optionally prepend a prefix followed by an underscore.
 *
 * Quick examples:
 * ```ts
 * generateULID();         // => 01J9M7K2W5C2Q7H1V8K9A3ZP3J
 * generateULID('user');   // => user_01J9M7K2W5C2Q7H1V8K9A3ZP3J
 * ```
 *
 * Notes:
 * - ULIDs sort correctly as strings by creation time.
 * - Output is URL-safe and case-insensitive.
 *
 * @param prefix Optional prefix to prepend (separated by "_").
 * @returns Generated ULID, with or without the given prefix.
 */
export const generateULID = (prefix?: string): string => {
	const id = ulid();
	return prefix ? `${prefix}_${id}` : id;
};
