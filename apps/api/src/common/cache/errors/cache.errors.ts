export const CacheErrors = {
	CACHE_INITIALIZATION_FAILED:
		'Failed to initialize cache connection. Please verify that Redis is running and accessible.',
	LIST_PUSH_FAILED: 'Failed to push values to cache list. The operation could not be completed.',
	LIST_POP_FAILED: 'Failed to pop values from cache list. The operation could not be completed.',
	LIST_LENGTH_FAILED:
		'Failed to get list length from cache. The operation could not be completed.',
	INVALID_LIST_KEY: 'Invalid key provided for list operation. Key must be a non-empty string.',
	LIST_VALUES_REQUIRED:
		'At least one value must be provided for list push operation. Cannot push an empty array.',
	NULL_VALUE_NOT_ALLOWED:
		'Cannot push null or undefined values to cache list. All values must be defined.',
};
