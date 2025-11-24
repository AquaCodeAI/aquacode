import { Module } from '@nestjs/common';
import { FilesModule } from '@aquacode/modules/files';
import { JobsModule } from '@aquacode/modules/jobs';
import { MemoriesModule } from '@aquacode/modules/memories';
import { MessagesModule } from '@aquacode/modules/messages';
import { PoliciesModule } from '@aquacode/modules/policies';
import { SandboxesModule } from '@aquacode/modules/sandboxes';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import {
	ChatCodeGeneratorService,
	ChatContextDiscoveryService,
	ChatMemoryExtractorService,
	ChatRouteResolverService,
	ChatSummaryService,
	ChatSystemPromptBuilderService,
} from './services';
import { ChatParseAquaBlocksService } from './utils';

@Module({
	imports: [
		MessagesModule,
		SandboxesModule,
		JobsModule,
		MemoriesModule,
		FilesModule,
		PoliciesModule,
	],
	controllers: [ChatController],
	providers: [
		ChatService,
		ChatContextDiscoveryService,
		ChatRouteResolverService,
		ChatSystemPromptBuilderService,
		ChatCodeGeneratorService,
		ChatSummaryService,
		ChatMemoryExtractorService,
		ChatParseAquaBlocksService,
	],
})
export class ChatModule {}
