import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { DeploymentsService } from './deployments.service';
import {
	DeploymentFilteringParameterDto,
	DeploymentItemResponseDto,
	DeploymentListResponseDto,
	DeploymentParameterDto,
} from './dtos';

@ApiTags('Deployments')
@ApiBearerAuth()
@Controller('v1/deployments')
export class DeploymentsController {
	constructor(private readonly deploymentsService: DeploymentsService) {}

	@Get()
	@HttpCode(200)
	@ApiOperation({ summary: 'Get Deployments' })
	@ApiResponse({
		status: 200,
		type: DeploymentListResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async getDeployments(
		@Query() filter: DeploymentFilteringParameterDto,
	): Promise<DeploymentListResponseDto> {
		const deployments = await this.deploymentsService.getDeployments(filter);
		return plainToInstance(DeploymentListResponseDto, deployments, {
			excludeExtraneousValues: true,
		});
	}

	@Get(':deploymentId')
	@HttpCode(200)
	@ApiOperation({ summary: 'Get Deployment' })
	@ApiResponse({
		status: 200,
		type: DeploymentItemResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 404,
		description: 'The requested resource or entity could not be found.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async getDeploymentById(
		@Param() { deploymentId }: DeploymentParameterDto,
	): Promise<DeploymentItemResponseDto> {
		const deployments = await this.deploymentsService.getDeploymentById(deploymentId);
		return plainToInstance(DeploymentItemResponseDto, deployments, {
			excludeExtraneousValues: true,
		});
	}

	@Post(':deploymentId/promote')
	@HttpCode(201)
	@ApiOperation({ summary: 'Promote Deployment' })
	@ApiResponse({
		status: 204,
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
	async promoteVercelPreviewDeploymentToProduction(
		@Param() { deploymentId }: DeploymentParameterDto,
	): Promise<void> {
		await this.deploymentsService.promoteVercelPreviewDeploymentToProduction({
			deploymentId,
		});
	}

	@Post(':deploymentId/rollback')
	@HttpCode(204)
	@ApiOperation({ summary: 'Rollback Deployment' })
	@ApiResponse({
		status: 204,
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
	async rollbackToDeployment(@Param() { deploymentId }: DeploymentParameterDto): Promise<void> {
		await this.deploymentsService.rollbackToDeployment({ deploymentId });
	}
}
