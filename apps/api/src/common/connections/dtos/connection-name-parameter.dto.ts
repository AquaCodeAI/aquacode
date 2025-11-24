import { PickType } from '@nestjs/swagger';
import { ConnectionDto } from './connection.dto';

export class ConnectionNameParameterDto extends PickType(ConnectionDto, ['name']) {}
