import { ApiProperty } from '@nestjs/swagger';
import { ItemResponseDto } from '@aquacode/common/dtos';
import { Expose, Type } from 'class-transformer';
import { ConnectionDto } from './connection.dto';

export class ConnectionItemResponseDto extends ItemResponseDto<ConnectionDto> {
	/**
	 * Connection data object
	 */
	@ApiProperty({
		type: ConnectionDto,
		description: 'Connection data object',
		required: true,
	})
	@Expose()
	@Type(() => ConnectionDto)
	declare result: ConnectionDto;
}
