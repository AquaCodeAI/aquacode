import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemoriesService } from './memories.service';
import { Memory, MemorySchema } from './schemas';

@Module({
	imports: [MongooseModule.forFeature([{ name: Memory.name, schema: MemorySchema }])],
	providers: [MemoriesService],
	exports: [MemoriesService],
})
export class MemoriesModule {}
