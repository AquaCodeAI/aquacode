import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { SandboxMetaDataVercelDto } from './sandbox-meta-data-vercel.dto';

export class SandboxMetaDataDto {
	/**
	 * Vercel sandbox metadata
	 */
	@ApiProperty({
		description: 'Vercel-related metadata for the sandbox.',
		required: false,
		type: () => SandboxMetaDataVercelDto,
	})
	@Expose()
	@Type(() => SandboxMetaDataVercelDto)
	@ValidateNested()
	@IsOptional()
	vercel?: SandboxMetaDataVercelDto;
}
