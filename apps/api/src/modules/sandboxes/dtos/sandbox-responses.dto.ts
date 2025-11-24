import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@aquacode/common';
import { Expose, Type } from 'class-transformer';
import { SandboxDto } from './sandbox.dto';

export class SandboxListResponseDto extends ListResponseDto<SandboxDto> {
	/**
	 * List of sandboxes
	 */
	@ApiProperty({
		type: [SandboxDto],
		isArray: true,
		description: 'List of sandboxes',
	})
	@Expose()
	@Type(() => SandboxDto)
	declare result: SandboxDto[];
}
