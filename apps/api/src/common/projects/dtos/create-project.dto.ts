import { ApiProperty, PickType } from '@nestjs/swagger';
import { AiModelEnum } from '@aquacode/common/ai';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProjectDto } from './project.dto';

export class CreateProjectDto extends PickType(ProjectDto, ['name', 'description'] as const) {
	/**
	 * AI model identifier
	 * @example 'claude-sonnet-4.5'
	 */
	@ApiProperty({
		type: String,
		description: 'AI model identifier',
		required: true,
		example: 'claude-sonnet-4.5',
		enum: AiModelEnum,
	})
	@Expose()
	@IsString({ message: 'AI model ID must be a string' })
	@IsNotEmpty({ message: 'AI model ID is required' })
	@IsEnum(AiModelEnum, { message: 'AI model ID must be a valid AI model identifier' })
	aiModelId: AiModelEnum;
}
