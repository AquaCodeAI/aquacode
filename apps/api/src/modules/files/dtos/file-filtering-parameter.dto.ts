import { IntersectionType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common';
import { FileDto } from './file.dto';

export class FileFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(FileDto, ['projectId']),
) {}
