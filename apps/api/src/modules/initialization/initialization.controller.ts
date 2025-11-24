import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicAuth } from '@aquacode/common';
import { InitializationService } from './initialization.service';

@ApiTags('Initialization')
@Controller('v1/initialization')
export class InitializationController {
	constructor(private readonly initializationService: InitializationService) {}

	@Get()
	@HttpCode(200)
	@PublicAuth()
	@ApiOperation({ summary: 'Initialize the platform' })
	@ApiResponse({
		status: 200,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 400,
		description: 'The provided data is invalid.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async initialize() {
		return this.initializationService.initialize();
	}
}
