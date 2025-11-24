import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CacheService, generateULID, ItemResponseDto, ListResponseDto } from '@aquacode/common';
import { SandboxesService } from '@aquacode/modules/sandboxes';
import { Model } from 'mongoose';
import { FileFilteringParameterDto, RollbackFilesDto, UpsertFileInSandboxDto } from './dtos';
import { File, FileDocument } from './schemas';
import { FilesTemplateService } from './services';

@Injectable()
export class FilesService {
	private readonly filePrefix: string = 'fil';

	constructor(
		@InjectModel(File.name)
		private readonly fileModel: Model<FileDocument>,
		private readonly filesTemplateService: FilesTemplateService,
		private readonly cacheService: CacheService,
		private readonly sandboxesService: SandboxesService,
	) {}

	getDefaultFiles() {
		return this.filesTemplateService.getDefaultTemplate();
	}

	getDefaultFileContentByName(name: string): string {
		const defaultTemplate = this.filesTemplateService.getDefaultTemplate();
		const file = defaultTemplate.find((template) => template.name === name);
		return file ? file.content : '';
	}

	async getFiles(filter: FileFilteringParameterDto): Promise<ListResponseDto<FileDocument>> {
		const { page, perPage, projectId } = filter;

		let query = this.fileModel.find({ projectId });
		if (page && perPage) {
			const skip = (page - 1) * perPage;
			query = query.skip(skip).limit(perPage).sort({ updatedAt: -1 });
		}

		const result: FileDocument[] = await query;
		const totalCount = await this.fileModel.countDocuments({ projectId });

		return {
			result,
			resultInfo: {
				page: page || 1,
				perPage: perPage || totalCount,
				totalCount,
			},
			success: true,
			errors: [],
			messages: [],
		};
	}

	async createDefaultFilesByProjectId(
		projectId: string,
	): Promise<ItemResponseDto<FileDocument[]>> {
		const defaultTemplate = this.filesTemplateService.getDefaultTemplate();
		const files = await this.fileModel.insertMany(
			defaultTemplate.map((template) => ({
				_id: generateULID(this.filePrefix),
				projectId,
				...template,
			})),
		);
		return {
			result: files,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async getFileStructureByProjectId(projectId: string): Promise<ItemResponseDto<string[]>> {
		const structure: string[] = await this.fileModel.find({ projectId }).distinct('name');
		return {
			result: structure,
			success: true,
			messages: [],
			errors: [],
		};
	}

	async findFileByProjectIdAndName(
		projectId: string,
		name: string,
	): Promise<FileDocument | null> {
		return this.fileModel.findOne({ projectId, name });
	}

	async rollbackFilesByProjectId(projectId: string, doc: RollbackFilesDto): Promise<void> {
		await this.fileModel.bulkWrite([
			{
				deleteMany: {
					filter: { projectId },
				},
			},
			...doc.files.map((doc) => ({
				insertOne: {
					document: {
						_id: generateULID(this.filePrefix),
						name: doc.name,
						content: doc.content,
						projectId,
					},
				},
			})),
		]);
	}

	async upsertFileInSandboxByProjectId(
		projectId: string,
		doc: UpsertFileInSandboxDto,
	): Promise<void> {
		const fileId = generateULID(this.filePrefix);
		await this.fileModel.findOneAndUpdate(
			{ projectId, name: doc.name },
			{
				$setOnInsert: {
					_id: fileId,
					projectId,
				},
				$set: doc,
			},
			{ upsert: true, new: true },
		);

		await this.sandboxesService
			.createSandboxFileByProjectId(projectId, doc.name, doc.content)
			.catch(() => void 0);
	}

	async applyQueuedFileChangesByProjectId(projectId: string) {
		const key = `project:${projectId}:aqua:pending`;
		const queuedChangeCount = await this.cacheService.llen(key);
		while (queuedChangeCount > 0) {
			const file = await this.cacheService.lpop<{
				type: string;
				file_path: string;
				content?: string;
			}>(key);
			if (!file) break;
			switch (file.type) {
				case 'aqua-write':
					await this.upsertFileInSandboxByProjectId(projectId, {
						name: file.file_path,
						content: file.content || '',
					});
					break;
			}
		}
	}
}
