import { Module } from '@nestjs/common';
import { SignUpHook } from './sign-up.hook';
import { SignUpService } from './sign-up.service';

@Module({
	providers: [SignUpHook, SignUpService],
})
export class SignUpModule {}
