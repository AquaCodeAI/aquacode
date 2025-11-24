import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import {
	CreateProjectDto,
	ProjectFilteringParameterDto,
	ProjectItemResponseDto,
	ProjectListResponseDto,
	ProjectParameterDto,
} from './dtos';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('v1/projects')
export class ProjectsController {
	constructor(private readonly projectsService: ProjectsService) {}

	@Get()
	@HttpCode(200)
	@ApiOperation({ summary: 'Get Projects' })
	@ApiResponse({
		status: 200,
		type: ProjectListResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async getProjects(
		@Query() filter: ProjectFilteringParameterDto,
	): Promise<ProjectListResponseDto> {
		const projects = await this.projectsService.getProjects(filter);
		return plainToInstance(ProjectListResponseDto, projects, {
			excludeExtraneousValues: true,
		});
	}

	@Post()
	@HttpCode(201)
	@ApiOperation({ summary: 'Create Project' })
	@ApiResponse({
		status: 201,
		type: ProjectItemResponseDto,
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
	async createProject(@Body() createProjectDto: CreateProjectDto) {
		const project = await this.projectsService.createProject(createProjectDto);
		return plainToInstance(ProjectItemResponseDto, project, {
			excludeExtraneousValues: true,
		});
	}

	@Get(':projectId')
	@HttpCode(200)
	@ApiOperation({ summary: 'Get Project' })
	@ApiResponse({
		status: 200,
		type: ProjectItemResponseDto,
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
	async getProject(@Param() { projectId }: ProjectParameterDto): Promise<ProjectItemResponseDto> {
		const project = await this.projectsService.getProjectById(projectId);
		return plainToInstance(ProjectItemResponseDto, project, {
			excludeExtraneousValues: true,
		});
	}
}
