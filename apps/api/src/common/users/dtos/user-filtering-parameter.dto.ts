import { IntersectionType, PickType } from '@nestjs/swagger';
import { PaginationDto } from '@aquacode/common/dtos';
import { UserDto } from './user.dto';

export class UserFilteringParameterDto extends IntersectionType(
	PaginationDto,
	PickType(UserDto, ['connection']),
) {}
