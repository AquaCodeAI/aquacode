import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { OptionalAuth } from '@aquacode/common';
import type { Request, Response } from 'express';
import { RestService } from './rest.service';

@Controller('v1/rest')
export class RestController {
	constructor(private readonly restService: RestService) {}

	@All('*path')
	@OptionalAuth()
	@ApiExcludeEndpoint()
	async forward(@Req() req: Request, @Res() res: Response) {
		return this.restService.forward(req, res);
	}
}
