import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
	ConnectionSchemaItem,
	ConnectionsService,
	generateULID,
	NotFoundException,
} from '@aquacode/common';
import { Model } from 'mongoose';
import { DocumentErrors } from './errors';
import { Document, DocumentDocument } from './schemas';
import { SchemaValidatorService } from './services';

type FindDocumentsParams = {
	__c: string;
	__s: string;
	page?: number;
	perPage?: number;
	filters?: Record<string, any>;
	sort?: Record<string, 1 | -1>;
};

type GetDocumentByIdParams = {
	_id: string;
	__c: string;
	__s: string;
};

type UpdateDocumentParams = {
	_id: string;
	__c: string;
	__s: string;
	data: Record<string, any>;
};

type DeleteDocumentParams = {
	_id: string;
	__c: string;
	__s: string;
};

@Injectable()
export class DocumentsService {
	constructor(
		@InjectModel(Document.name)
		private readonly documentModel: Model<DocumentDocument>,
		private readonly schemaValidator: SchemaValidatorService,
		private readonly connectionsService: ConnectionsService,
	) {}

	async findDocuments(options: FindDocumentsParams): Promise<{
		result: DocumentDocument[];
		resultInfo: { page: number; perPage: number; totalCount: number };
	}> {
		const { __c, __s, filters, page, perPage, sort } = options;

		const currentPage = page ?? 1;
		const currentPerPage = perPage ?? 20;

		const skip = (currentPage - 1) * currentPerPage;

		const query = { __c, __s, ...(filters ?? {}) };

		const [result, totalCount] = await Promise.all([
			this.documentModel
				.find(query)
				.sort(sort || { createdAt: -1 })
				.skip(skip)
				.limit(currentPerPage)
				.exec(),
			this.documentModel.countDocuments(query).lean().exec(),
		]);

		return {
			result,
			resultInfo: {
				page: currentPage,
				perPage: currentPerPage,
				totalCount,
			},
		};
	}

	async getDocumentById(options: GetDocumentByIdParams): Promise<DocumentDocument | null> {
		const { _id, __c, __s } = options;
		return this.documentModel.findOne({ _id, __c, __s });
	}

	async createDocument(
		options: Record<string, any>,
		connectionSchema?: ConnectionSchemaItem,
	): Promise<DocumentDocument> {
		let schema = connectionSchema;

		if (!schema) {
			const { result: connection } = await this.connectionsService.getConnectionByName(
				options.__c,
			);
			schema = connection.schemas.find((s) => s.name === options.__s);
			if (!schema)
				throw new NotFoundException({
					errors: DocumentErrors.SCHEMA_NOT_FOUND(options.__s),
				});
		}

		// Validate data against schema
		this.schemaValidator.validateOrThrow(options, schema);

		// Apply defaults from schema
		const dataWithDefaults = this.schemaValidator.applyDefaults(options, schema);

		// Generate ULID for _id if not provided
		if (!dataWithDefaults._id) dataWithDefaults._id = generateULID(schema.prefix);

		return this.documentModel.create(dataWithDefaults);
	}

	async updateDocument(options: UpdateDocumentParams): Promise<DocumentDocument | null> {
		const { _id, __c, __s, data } = options;
		return this.documentModel.findOneAndUpdate(
			{ _id, __c, __s },
			{ $set: data },
			{ new: true, runValidators: true },
		);
	}

	async deleteDocument(options: DeleteDocumentParams): Promise<DocumentDocument | null> {
		const { _id, __c, __s } = options;
		return this.documentModel.findByIdAndDelete({ _id, __c, __s });
	}
}
