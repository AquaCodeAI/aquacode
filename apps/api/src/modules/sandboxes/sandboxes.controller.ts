import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { SandboxesFilteringParameterDto, SandboxListResponseDto } from './dtos';
import { SandboxesService } from './sandboxes.service';

@ApiTags('Sandboxes')
@ApiBearerAuth()
@Controller('v1/sandboxes')
export class SandboxesController {
	constructor(private readonly sandboxesService: SandboxesService) {}

	@Get()
	@HttpCode(200)
	@ApiOperation({ summary: 'Get Sandboxes' })
	@ApiResponse({
		status: 200,
		type: SandboxListResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async getProjectSandboxes(
		@Query() filter: SandboxesFilteringParameterDto,
	): Promise<SandboxListResponseDto> {
		const sandboxes = await this.sandboxesService.getSandboxes(filter);
		return plainToInstance(SandboxListResponseDto, sandboxes, {
			excludeExtraneousValues: true,
		});
	}
}
