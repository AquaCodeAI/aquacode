import { IntersectionType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common';
import { MessageDto } from './message.dto';

export class MessageFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(MessageDto, ['projectId']),
) {}
