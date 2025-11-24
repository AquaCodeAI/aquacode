import { Injectable } from '@nestjs/common';
import { type AuthHookContext, AuthHooks, OnAfterAuth, OnBeforeAuth } from '@aquacode/common/auth';
import { SignInService } from './sign-in.service';

@AuthHooks()
@Injectable()
export class SignInHook {
	constructor(private readonly signInService: SignInService) {}

	@OnBeforeAuth('/sign-in/email')
	async handleBeforeSignIn(ctx: AuthHookContext) {
		await this.signInService.handleBeforeSignIn(ctx);
	}

	@OnAfterAuth('/sign-in/email')
	async handleAfterSignIn(ctx: AuthHookContext) {
		await this.signInService.handleAfterSignIn(ctx);
	}
}
