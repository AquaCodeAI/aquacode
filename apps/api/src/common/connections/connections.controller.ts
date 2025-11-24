import { Controller, Get, HttpCode, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ConnectionsService } from './connections.service';
import { ConnectionItemResponseDto, ConnectionNameParameterDto } from './dtos';

@ApiTags('Connections')
@ApiBearerAuth()
@Controller('v1/connections')
export class ConnectionsController {
	constructor(private readonly connectionsService: ConnectionsService) {}

	@Get(':name')
	@HttpCode(200)
	@ApiOperation({ summary: 'Get Connection' })
	@ApiResponse({
		status: 200,
		type: ConnectionItemResponseDto,
		description: 'Operation completed successfully.',
	})
	@ApiResponse({
		status: 404,
		description: 'The requested resource or entity could not be found.',
	})
	@ApiResponse({
		status: 500,
		description: 'An internal server error occurred while processing your request.',
	})
	async getConnection(
		@Param() { name }: ConnectionNameParameterDto,
	): Promise<ConnectionItemResponseDto> {
		const connection = await this.connectionsService.getConnectionByName(name);
		return plainToInstance(ConnectionItemResponseDto, connection, {
			excludeExtraneousValues: true,
		});
	}
}
