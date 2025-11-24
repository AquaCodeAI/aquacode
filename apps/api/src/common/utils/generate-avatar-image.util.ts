/**
 * Generate a deterministic avatar image URL based on the first letter of the name.
 * Only a–z (lowercase) is used; otherwise it falls back to "u" (user).
 *
 * Quick examples:
 * ```ts
 * generateAvatarImage('Carlos'); // => https://.../c.png
 * generateAvatarImage('9juan'); // => https://.../u.png
 * generateAvatarImage(''); // => https://.../u.png
 * ```
 *
 * Notes:
 * - The image base domain is public storage and may change in future versions.
 * - The function does not fetch or validate the URL; it only builds it.
 *
 * @param name User display name.
 * @returns Absolute URL of the corresponding avatar image.
 */
const AVATAR_DOMAIN = 'https://storage.aquacode.ai/bali/assets/avatars';

export function generateAvatarImage(name: string): string {
	if (!name || name.length === 0) {
		return `${AVATAR_DOMAIN}/u.png`;
	}

	const firstLetter = name.charAt(0).toLowerCase();
	const validLetter = /^[a-z]$/.test(firstLetter) ? firstLetter : 'u';
	return `${AVATAR_DOMAIN}/${validLetter}.png`;
}
