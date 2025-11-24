/**
 * Flatten a nested object into a single-level map using dot notation for keys.
 * Useful for databases and update operations (e.g., Mongo/Mongoose) that expect flat paths.
 *
 * Type signature:
 * ```ts
 * function flattenObject(
 *   obj: Record<string, unknown>,
 *   prefix?: string,
 *   seen?: WeakSet<object>,
 * ): Record<string, unknown>
 * ```
 *
 * Quick example:
 * ```ts
 * const nested = { user: { profile: { name: 'John', address: { city: 'NY' } } } };
 * const flat = flattenObject(nested);
 * // => { 'user.profile.name': 'John', 'user.profile.address.city': 'NY' }
 * ```
 *
 * Notes:
 * - Circular references are skipped to avoid infinite recursion.
 * - Arrays are not expanded; they are returned as-is.
 *
 * @param obj Object to flatten.
 * @param prefix Optional prefix for keys (used internally during recursion).
 * @param seen Optional WeakSet used to avoid circular references.
 * @returns A flat object with dot-notated keys.
 */
export function flattenObject(
	obj: Record<string, unknown>,
	prefix = '',
	seen = new WeakSet(),
): Record<string, unknown> {
	// Check for circular references
	if (typeof obj === 'object' && obj !== null) {
		if (seen.has(obj)) {
			// Skip this object to prevent infinite recursion
			return {};
		}
		seen.add(obj);
	}

	return Object.keys(obj).reduce<Record<string, unknown>>((acc, key: string) => {
		const prefixedKey = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];

		if (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value) &&
			Object.keys(value as Record<string, unknown>).length > 0
		) {
			// Recursively flatten nested objects, passing the seen set to track circular references
			Object.assign(acc, flattenObject(value as Record<string, unknown>, prefixedKey, seen));
		} else {
			// Add the property to the result
			acc[prefixedKey] = value;
		}

		return acc;
	}, {});
}
