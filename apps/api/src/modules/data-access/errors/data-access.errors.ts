export const DataAccessErrors = {
	POLICY_LIMIT_EXCEEDED:
		'Too many policies to evaluate. Maximum of 100 policies allowed per request.',
	POLICY_VALIDATION_FAILED:
		'Policy validation failed. The policy filter contains invalid syntax or references.',
	NO_APPLICABLE_FIND_POLICIES:
		'Access denied: No applicable FIND policies found for this resource.',
	DOCUMENT_NOT_FOUND: 'The requested document does not exist or has been deleted.',
	ACCESS_DENIED_READ: 'Access denied: You do not have permission to read this document.',
	ACCESS_DENIED_UPDATE: 'Access denied: You do not have permission to update this document.',
	ACCESS_DENIED_DELETE: 'Access denied: You do not have permission to delete this document.',
	AUTH_REQUIRED_MISSING_CONTEXT: (ref: string) =>
		`Authentication required: Policy requires '${ref}' but user is not authenticated. Please sign in and try again.`,
	AUTH_REQUIRED_UNRESOLVED_REFERENCE: (ref: string) =>
		`Authentication required: Cannot resolve '${ref}' from the authentication context. Please verify the policy configuration.`,
};
