import { Module } from '@nestjs/common';
import { InitializationController } from './initialization.controller';
import { InitializationService } from './initialization.service';

@Module({
	controllers: [InitializationController],
	providers: [InitializationService],
})
export class InitializationModule {}
