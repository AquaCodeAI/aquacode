import { Controller, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { OptionalAuth } from '@aquacode/common';
import type { Request, Response } from 'express';
import { SignOutService } from './sign-out.service';

@Controller('v1/sign-out')
export class SignOutController {
	constructor(private readonly signOutService: SignOutService) {}

	@Post()
	@OptionalAuth()
	@ApiExcludeEndpoint()
	async signOut(@Req() req: Request, @Res() res: Response) {
		const result = await this.signOutService.signOut(req);
		return res.json(result);
	}
}
