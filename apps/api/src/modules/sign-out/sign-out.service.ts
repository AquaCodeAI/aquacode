import { Injectable } from '@nestjs/common';
import { AQUA_COOKIE_SESSION_TOKEN, AuthService, BEARER_PREFIX } from '@aquacode/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';

@Injectable()
export class SignOutService {
	constructor(private readonly authService: AuthService) {}

	async signOut(req: Request) {
		try {
			const authHeader = req.get('authorization');

			let headers: Headers;
			if (authHeader?.startsWith(BEARER_PREFIX)) {
				const rawToken = authHeader.substring(7);
				const token = decodeURIComponent(rawToken);

				headers = fromNodeHeaders(req.headers);
				headers.set('cookie', `${AQUA_COOKIE_SESSION_TOKEN}=${token}`);
			} else {
				headers = fromNodeHeaders(req.headers);
			}

			return await this.authService.getAuthApi().signOut({
				headers: headers,
			});
		} catch {
			return { success: false };
		}
	}
}
