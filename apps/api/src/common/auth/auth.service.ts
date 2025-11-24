import { Inject, Injectable } from '@nestjs/common';
import type { AuthType } from '@aquacode/common/common.module';

export const AUTH_INSTANCE_KEY = Symbol('AUTH_INSTANCE');

@Injectable()
export class AuthService {
	constructor(
		@Inject(AUTH_INSTANCE_KEY)
		private readonly auth?: AuthType,
	) {}

	/**
	 * Retrieves the authentication instance
	 */
	getAuth(): AuthType {
		return this.auth as AuthType;
	}

	/**
	 * Retrieves the authentication API instance.
	 */
	getAuthApi(): AuthType['api'] {
		return this.getAuth().api;
	}
}
