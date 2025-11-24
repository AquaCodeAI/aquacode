import { Injectable } from '@nestjs/common';
import { type AuthHookContext, AuthHooks, OnAfterAuth, OnBeforeAuth } from '@aquacode/common';
import { SignUpService } from './sign-up.service';

@AuthHooks()
@Injectable()
export class SignUpHook {
	constructor(private readonly signUpService: SignUpService) {}

	@OnBeforeAuth('/sign-up/email')
	async handleBeforeSignIn(ctx: AuthHookContext) {
		await this.signUpService.handleBeforeSignUp(ctx);
	}

	@OnAfterAuth('/sign-up/email')
	async handleAfterSignIn(ctx: AuthHookContext) {
		await this.signUpService.handleAfterSignUp(ctx);
	}
}
