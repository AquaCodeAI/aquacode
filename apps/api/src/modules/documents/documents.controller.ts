import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Query,
	SerializeOptions,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import {
	CreateDocumentDto,
	DocumentConnectionSchemaQueryDto,
	DocumentDto,
	DocumentParameterDto,
	DocumentsFilteringParameterDto,
} from './dtos';
import { Document } from './schemas';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('v1/documents')
export class DocumentsController {
	constructor(private readonly documentsService: DocumentsService) {}

	@Get()
	@HttpCode(200)
	@SerializeOptions({ excludeExtraneousValues: false })
	@ApiOperation({ summary: 'Get Documents' })
	@ApiResponse({
		status: 200,
		type: [DocumentDto],
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async list(@Query() filter: DocumentsFilteringParameterDto): Promise<{
		result: Document[];
		resultInfo: { page: number; perPage: number; totalCount: number };
	}> {
		const documents = await this.documentsService.findDocuments(filter);
		return JSON.parse(JSON.stringify(documents));
	}

	@Post()
	@HttpCode(201)
	@SerializeOptions({ excludeExtraneousValues: false })
	@ApiOperation({ summary: 'Create Document' })
	@ApiResponse({
		status: 201,
		type: DocumentDto,
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
	async create(@Body() createDocumentDto: CreateDocumentDto): Promise<Document> {
		const document = await this.documentsService.createDocument(createDocumentDto);
		return JSON.parse(JSON.stringify(document));
	}

	@Delete(':documentId')
	@HttpCode(200)
	@SerializeOptions({ excludeExtraneousValues: false })
	@ApiOperation({ summary: 'Delete Document' })
	@ApiResponse({
		status: 200,
		schema: {
			oneOf: [{ $ref: getSchemaPath(DocumentDto) }, { type: 'null' }],
		},
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async remove(
		@Param() { documentId }: DocumentParameterDto,
		@Query() { __c, __s }: DocumentConnectionSchemaQueryDto,
	): Promise<Document | string> {
		const document = await this.documentsService.deleteDocument({ _id: documentId, __s, __c });
		if (!document) return JSON.stringify(null);
		return JSON.parse(JSON.stringify(document));
	}
}
