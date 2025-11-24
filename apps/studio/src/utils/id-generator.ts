import { ulid } from 'ulid';

/**
 * Generates a ULID (Universally Unique Lexicographically Sortable Identifier) with an optional prefix
 * @param prefix Optional prefix to add to the id (separated by '_')
 * @returns A string containing the generated ULID with the optional prefix
 */
export const generateULID = (prefix?: string): string => {
  const id = ulid();
  return prefix ? `${prefix}_${id}` : id;
};
