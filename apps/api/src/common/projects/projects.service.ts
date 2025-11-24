import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConnectionsService } from '@aquacode/common/connections';
import { ItemResponseDto, ListResponseDto } from '@aquacode/common/dtos';
import { BadRequestException, NotFoundException } from '@aquacode/common/exceptions';
import { VercelService } from '@aquacode/common/services';
import { generateULID } from '@aquacode/common/utils';
import { Model } from 'mongoose';
import { CreateProjectDto, ProjectFilteringParameterDto } from './dtos';
import { ProjectErrors } from './errors';
import { Project, ProjectDocument } from './schemas';
import { ProjectEnrichmentService } from './services';

@Injectable()
export class ProjectsService {
	private readonly projectPrefix: string = 'prj';
	private readonly projectConnectionPrefix: string = 'Project-Connection';
	private readonly defaultConnectionName: string = 'Aqua-Connection';

	constructor(
		@InjectModel(Project.name)
		private readonly projectModel: Model<ProjectDocument>,
		private readonly connectionsService: ConnectionsService,
		private readonly projectEnrichmentService: ProjectEnrichmentService,
		private readonly vercelService: VercelService,
	) {}

	async getProjects(
		filter: ProjectFilteringParameterDto,
	): Promise<ListResponseDto<ProjectDocument>> {
		const { page, perPage } = filter;

		let query = this.projectModel.find({ isPlatform: false });
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage).sort({ updatedAt: -1 });
		}

		const result: ProjectDocument[] = await query;
		const totalCount = await this.projectModel.countDocuments({ isPlatform: false });

		return {
			result,
			resultInfo: {
				page: page || 1,
				perPage: perPage || totalCount,
				totalCount,
			},
			success: true,
			messages: [],
			errors: [],
		};
	}

	async createProject(doc: CreateProjectDto): Promise<ItemResponseDto<ProjectDocument>> {
		const ulid = generateULID();

		const newConnectionName = `${this.projectConnectionPrefix}-${ulid}`;
		const { result: connection } =
			await this.connectionsService.upsertConnectionByName(newConnectionName);

		let project: ProjectDocument;
		const projectId = this.projectPrefix + '_' + ulid;
		if (doc.name && doc.description) {
			// First, create the local project
			const { result: projectExists } = await this.checkProjectExistsByName(doc.name);
			if (projectExists) {
				throw new BadRequestException({
					errors: ProjectErrors.PROJECT_NAME_ALREADY_EXISTS,
				});
			}
			project = await this.projectModel.create({ _id: projectId, ...doc });
		} else {
			if (!doc.description?.trim()) {
				throw new BadRequestException({
					errors: ProjectErrors.PROJECT_DESCRIPTION_IS_REQUIRED,
				});
			}

			const { result: estimatedProjectCount } = await this.estimatedProjectCount();
			// Create the project with the name and description
			const { name, description } = await this.projectEnrichmentService.enrichProject(
				doc?.name ?? null,
				doc.description,
				estimatedProjectCount,
				doc.aiModelId,
			);
			project = await this.projectModel.create({
				_id: projectId,
				name,
				description,
				connection: connection.name,
			});
		}

		const vercelProject = await this.vercelService.createProject({ name: project.name });
		const vercelProjectId = vercelProject.id;
		await this.projectModel.updateOne(
			{ _id: project._id },
			{
				$set: {
					domain: `${project.name}.vercel.app`,
					'projectMetaData.vercel': { projectId: vercelProjectId },
				},
			},
		);

		return {
			result: project,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async createAquaProject(doc: Omit<CreateProjectDto, 'aiModelId'>) {
		const { result: connection } = await this.connectionsService.upsertConnectionByName(
			this.defaultConnectionName,
		);

		const { result: projectExists } = await this.checkProjectExistsByName(doc.name);
		if (projectExists) {
			throw new BadRequestException({
				errors: ProjectErrors.PROJECT_NAME_ALREADY_EXISTS,
			});
		}

		const projectId = generateULID(this.projectPrefix);
		const project = await this.projectModel.create({
			_id: projectId,
			connection: connection.name,
			isPlatform: true,
			...doc,
		});

		return {
			result: project,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getProjectById(projectId: string): Promise<ItemResponseDto<ProjectDocument>> {
		const project = await this.projectModel.findOne({ _id: projectId });
		if (!project) throw new NotFoundException({ errors: ProjectErrors.PROJECT_NOT_FOUND });
		return {
			result: project,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getProjectByName(name: string): Promise<ItemResponseDto<ProjectDocument>> {
		const project = await this.projectModel.findOne({ name });
		if (!project) throw new NotFoundException({ errors: ProjectErrors.PROJECT_NOT_FOUND });
		return {
			result: project,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async checkProjectExistsByName(name: string): Promise<ItemResponseDto<boolean>> {
		const project = await this.projectModel.exists({ name });
		return {
			result: Boolean(project),
			success: true,
			messages: [],
			errors: [],
		};
	}

	async estimatedProjectCount(): Promise<ItemResponseDto<number>> {
		const estimatedProjectCount = await this.projectModel.estimatedDocumentCount();
		return {
			result: estimatedProjectCount,
			success: true,
			messages: [],
			errors: [],
		};
	}
}
