import { Module } from '@nestjs/common';
import { CommonModule } from '@aquacode/common';
import { SignOutController } from './sign-out.controller';
import { SignOutService } from './sign-out.service';

@Module({
	imports: [CommonModule],
	controllers: [SignOutController],
	providers: [SignOutService],
})
export class SignOutModule {}
