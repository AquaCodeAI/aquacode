import { Module } from '@nestjs/common';
import { SignInHook } from './sign-in.hook';
import { SignInService } from './sign-in.service';

@Module({
	providers: [SignInHook, SignInService],
})
export class SignInModule {}
