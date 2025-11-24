import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { Connection, ConnectionSchema } from './schemas';

@Global()
@Module({
	imports: [MongooseModule.forFeature([{ name: Connection.name, schema: ConnectionSchema }])],
	controllers: [ConnectionsController],
	providers: [ConnectionsService],
	exports: [ConnectionsService],
})
export class ConnectionsModule {}
