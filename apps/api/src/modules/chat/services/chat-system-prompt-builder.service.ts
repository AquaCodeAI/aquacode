import { Injectable } from '@nestjs/common';
import { ConnectionDocument } from '@aquacode/common';
import { MemoryDocument } from '@aquacode/modules/memories';
import { MessageDocument, MessageRole } from '@aquacode/modules/messages';
import { PolicyDocument } from '@aquacode/modules/policies';
import { ChatParseAquaBlocksService } from '../utils';
import { ContextFile } from './chat-context-discovery.service';

@Injectable()
export class ChatSystemPromptBuilderService {
	private static readonly MAX_CONVERSATION_MESSAGES = 6;
	private static readonly MAX_MEMORY_ITEMS = 8;
	private static readonly FILE_INDENT_SPACES = 6;

	constructor(private readonly parseAquaBlocks: ChatParseAquaBlocksService) {}

	/**
	 * Builds the system prompt for the context discovery phase
	 * Used by: chatContextDiscoveryService
	 * Includes: memory, summary, conversation, and project structure
	 */
	buildPromptForDiscovery(
		memory: MemoryDocument,
		recentMessages: MessageDocument[],
		projectStructure: string[],
	): string {
		const promptSections: string[] = [];

		this.appendLongTermMemorySection(promptSections, memory);
		this.appendLastAISummarySection(promptSections, recentMessages);
		this.appendConversationHistorySection(promptSections, recentMessages);
		this.appendProjectStructureSection(promptSections, projectStructure);

		return this.joinPromptSections(promptSections);
	}

	/**
	 * Builds the complete system prompt for the code generation phase
	 * Used by: chatCodeGeneratorService
	 * Includes: memory, summary, conversation, structure, database, policies, and files
	 */
	buildPromptForCodeGeneration(
		memory: MemoryDocument,
		recentMessages: MessageDocument[],
		projectStructure: string[],
		connection: ConnectionDocument,
		policies: PolicyDocument[],
		files: ContextFile[],
	): string {
		const promptSections: string[] = [];

		this.appendLongTermMemorySection(promptSections, memory);
		this.appendLastAISummarySection(promptSections, recentMessages);
		this.appendConversationHistorySection(promptSections, recentMessages);
		this.appendProjectStructureSection(promptSections, projectStructure);
		this.appendDatabaseConnectionSection(promptSections, connection);
		this.appendSecurityPoliciesSection(promptSections, policies);
		this.appendDiscoveredFilesSection(promptSections, files);

		return this.joinPromptSections(promptSections);
	}

	/**
	 * Add a long-term memory section
	 * Contains important project decisions and context
	 */
	private appendLongTermMemorySection(sections: string[], memory: MemoryDocument): void {
		const memoryItems = this.formatMemoryItems(memory);

		sections.push(
			'<project_memory>',
			'  Long-term knowledge about this project (private, do not repeat verbatim to user):',
			'  ',
			memoryItems,
			'</project_memory>',
		);
	}

	/**
	 * Add the last AI response summary if available
	 * Helps maintain context continuity
	 */
	private appendLastAISummarySection(sections: string[], messages: MessageDocument[]): void {
		const lastAIMessage = this.getLastAIMessage(messages);

		if (!lastAIMessage?.summary) {
			return;
		}

		sections.push(
			'',
			'<recent_summary>',
			`  Last action performed: ${lastAIMessage.summary}`,
			'</recent_summary>',
		);
	}

	/**
	 * Add the recent conversation history
	 * Provides context from last 6 messages
	 */
	private appendConversationHistorySection(
		sections: string[],
		messages: MessageDocument[],
	): void {
		const formattedMessages = this.formatRecentMessages(messages);

		if (formattedMessages.length === 0) {
			return;
		}

		sections.push(
			'',
			'<conversation_history>',
			...formattedMessages,
			'</conversation_history>',
		);
	}

	/**
	 * Add the current project file structure
	 * Essential for understanding project layout
	 */
	private appendProjectStructureSection(sections: string[], projectStructure: string[]): void {
		if (projectStructure.length === 0) {
			return;
		}

		const structureLines = projectStructure.map((line) => `  • ${line}`);

		sections.push(
			'',
			'<project_structure>',
			'  Current project files:',
			'  ',
			...structureLines,
			'</project_structure>',
		);
	}

	/**
	 * Add the database connection information
	 * Required for backend operations
	 */
	private appendDatabaseConnectionSection(
		sections: string[],
		connection: ConnectionDocument,
	): void {
		const connectionInfo = connection.toObject();

		sections.push(
			'',
			'<database_connection>',
			'  Active database connection for this project:',
			'  ',
			`  ${JSON.stringify(connectionInfo, null, 2)}`,
			'</database_connection>',
		);
	}

	/**
	 * Add the security policies grouped by schema
	 * Critical for understanding data access rules
	 */
	private appendSecurityPoliciesSection(sections: string[], policies: PolicyDocument[]): void {
		if (!policies || policies.length === 0) {
			return;
		}

		const policiesBySchema = this.groupPoliciesBySchema(policies);

		sections.push(
			'',
			'<security_policies>',
			'  Data access policies by schema:',
			'  ',
			`  ${JSON.stringify(policiesBySchema, null, 2)}`,
			'</security_policies>',
		);
	}

	/**
	 * Add discovered files organized by category
	 * Main context section with all relevant code
	 */
	private appendDiscoveredFilesSection(sections: string[], files: ContextFile[]): void {
		if (files.length === 0) {
			return;
		}

		const filesSectionContent = this.buildDiscoveredFilesContent(files);
		sections.push('', filesSectionContent);
	}

	private formatMemoryItems(memory: MemoryDocument): string {
		if (memory.longTerm.length === 0) {
			return '• No stored decisions yet';
		}

		return memory.longTerm
			.map((item) => `• ${item.value}`)
			.slice(-ChatSystemPromptBuilderService.MAX_MEMORY_ITEMS)
			.join('\n');
	}

	private getLastAIMessage(messages: MessageDocument[]): MessageDocument | undefined {
		const aiMessages = messages.filter((m) => m.role === MessageRole.AI);
		return aiMessages[aiMessages.length - 1];
	}

	private formatRecentMessages(messages: MessageDocument[]): string[] {
		return messages
			.slice(-ChatSystemPromptBuilderService.MAX_CONVERSATION_MESSAGES)
			.map((message) => this.formatSingleMessage(message));
	}

	private formatSingleMessage(message: MessageDocument): string {
		if (message.content && message.role === MessageRole.AI) {
			const formatted = this.extractAIResponseBlocks(message.content);
			return `  ${message.role}: ${JSON.stringify(formatted)}`;
		}

		const sanitizedContent = message.content?.replace(/\n/g, ' ') ?? '';
		return `  ${message.role}: ${sanitizedContent}`;
	}

	private groupPoliciesBySchema(policies: PolicyDocument[]): Record<string, any[]> {
		return policies.reduce((groups: Record<string, any[]>, policy) => {
			if (!groups[policy.schemaName]) {
				groups[policy.schemaName] = [];
			}

			groups[policy.schemaName].push({
				policyName: policy.policyName,
				policyOperation: policy.policyOperation,
				policyFilterQuery: policy.policyFilterQuery,
				policyUpdateQuery: policy.policyUpdateQuery,
			});

			return groups;
		}, {});
	}

	private buildDiscoveredFilesContent(files: ContextFile[]): string {
		const sections = [
			'<discovered_files>',
			`  Explored ${files.length} files relevant to your request:`,
			'',
		];

		const categorizedFiles = this.categorizeFiles(files);
		this.appendCategorizedFileSections(sections, categorizedFiles);
		this.appendUsageGuidelines(sections);

		sections.push('</discovered_files>');

		return sections.join('\n');
	}

	private categorizeFiles(files: ContextFile[]): Record<string, ContextFile[]> {
		return {
			Pages: files.filter((f) => f.path.includes('/app/(app)/')),
			'State Management': files.filter(
				(f) =>
					f.path.includes('/stores/') ||
					f.path.includes('/contexts/') ||
					f.path.includes('/hooks/'),
			),
			Components: files.filter((f) => f.path.includes('/components/')),
			Configuration: files.filter((f) => f.path.includes('/configurations/')),
			Constants: files.filter((f) => f.path.includes('/constants/')),
			Interfaces: files.filter((f) => f.path.includes('/interfaces/')),
			Utilities: files.filter((f) => f.path.includes('/utils/')),
			Other: files.filter(
				(f) =>
					!f.path.includes('/(app)/') &&
					!f.path.includes('/stores/') &&
					!f.path.includes('/contexts/') &&
					!f.path.includes('/hooks/') &&
					!f.path.includes('/components/') &&
					!f.path.includes('/configurations/') &&
					!f.path.includes('/constants/') &&
					!f.path.includes('/interfaces/') &&
					!f.path.includes('/utils/'),
			),
		};
	}

	private appendCategorizedFileSections(
		sections: string[],
		categorizedFiles: Record<string, ContextFile[]>,
	): void {
		for (const [category, categoryFiles] of Object.entries(categorizedFiles)) {
			if (categoryFiles.length === 0) {
				continue;
			}

			const categoryTag = this.formatCategoryTag(category);
			sections.push(`  <${categoryTag}>`);

			for (const file of categoryFiles) {
				sections.push(`    <file path="${file.path}" reason="${file.reason}">`);
				sections.push(
					this.indentContent(
						file.content,
						ChatSystemPromptBuilderService.FILE_INDENT_SPACES,
					),
				);
				sections.push('    </file>');
				sections.push('');
			}

			sections.push(`  </${categoryTag}>`);
			sections.push('');
		}
	}

	private appendUsageGuidelines(sections: string[]): void {
		sections.push('  <usage_guidelines>');
		sections.push('    • These files contain the exact patterns you should follow');
		sections.push('    • Reuse existing code structures and conventions');
		sections.push('    • Follow the same coding style and naming patterns');
		sections.push('    • Only modify what is necessary for the request');
		sections.push('    • Maintain consistency with existing implementations');
		sections.push('  </usage_guidelines>');
	}

	private formatCategoryTag(category: string): string {
		return category.toLowerCase().replace(' ', '_');
	}

	/**
	 * Formats AI response blocks for context display
	 * Extracts think, write, and summarize blocks
	 */
	private extractAIResponseBlocks(text: string): { name: string; data: string }[] {
		const blocks = this.parseAquaBlocks.parseAquaBlocks(text);
		const result: { name: string; data: string }[] = [];

		const thinkBlock = blocks.find((b) => b.name === 'aqua-think');
		const writeBlock = blocks.find((b) => b.name === 'aqua-write');
		const summaryBlock = blocks.find((b) => b.name === 'aqua-summarize');

		if (thinkBlock?.data) {
			result.push({
				name: 'Analysis & Planning',
				data: thinkBlock.data,
			});
		}

		if (writeBlock?.data) {
			result.push({
				name: 'Code',
				data: writeBlock.data,
			});
		}

		if (summaryBlock?.data) {
			result.push({
				name: 'Summary',
				data: summaryBlock.data,
			});
		}

		return result;
	}

	/**
	 * Indents content for proper XML formatting
	 */
	private indentContent(content: string, spaces: number): string {
		const indent = ' '.repeat(spaces);
		return content
			.split('\n')
			.map((line) => indent + line)
			.join('\n');
	}

	private joinPromptSections(sections: string[]): string {
		return sections.join('\n');
	}
}
