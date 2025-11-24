import { ApiProperty } from '@nestjs/swagger';
import { ItemResponseDto, ListResponseDto } from '@aquacode/common/dtos';
import { Expose, Type } from 'class-transformer';
import { ProjectDto } from './project.dto';

export class ProjectListResponseDto extends ListResponseDto<ProjectDto> {
	/**
	 * List of projects
	 */
	@ApiProperty({
		type: [ProjectDto],
		isArray: true,
		description: 'List of projects',
	})
	@Expose()
	@Type(() => ProjectDto)
	declare result: ProjectDto[];
}

export class ProjectItemResponseDto extends ItemResponseDto<ProjectDto> {
	/**
	 * Project data object
	 */
	@ApiProperty({
		type: ProjectDto,
		description: 'Project data object',
		required: true,
	})
	@Expose()
	@Type(() => ProjectDto)
	declare result: ProjectDto;
}
