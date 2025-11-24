import { Global, Module } from '@nestjs/common';
import { MessengerGateway } from './messenger.gateway';
import { MessengerService } from './messenger.service';

@Global()
@Module({
	providers: [MessengerGateway, MessengerService],
	exports: [MessengerService],
})
export class MessengerModule {}
