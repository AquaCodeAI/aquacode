import { Injectable, Logger } from '@nestjs/common';
import { AiModelEnum, ProviderRegistry } from '@aquacode/common';
import { FilesService } from '@aquacode/modules/files';
import ts from 'typescript';
import { ChatRouteResolverService } from './chat-route-resolver.service';

export interface ContextFile {
	path: string;
	content: string;
	reason: string;
	depth: number;
}

interface ActionRequest {
	action: 'get_structure' | 'open_file' | 'search_project' | 'done';
	target?: string;
	reason: string;
}

interface DiscoveryContext {
	prompt: string;
	initialContext: string;
	projectStructure: string[];
	currentFiles: ContextFile[];
	structuresViewed: Set<string>;
	depth: number;
	discoverySystemPrompt: string;
}

@Injectable()
export class ChatContextDiscoveryService {
	private readonly logger = new Logger(ChatContextDiscoveryService.name);

	// Configuration constants
	private static readonly MAX_DEPTH = 50;
	private static readonly MAX_FILES = 20;
	private static readonly MAX_SEARCH_RESULTS = 3;
	private static readonly CONTEXT_LINES_AROUND_MATCH = 5;
	private static readonly MAX_FILE_SIZE_BYTES = 25000;
	private static readonly MAX_STRUCTURE_PREVIEW_BYTES = 500;
	private static readonly PROJECT_STRUCTURE_PREVIEW_LIMIT = 200;
	private static readonly LLM_MAX_ATTEMPTS = 3;
	private static readonly LLM_TIMEOUT_MS = 30000;
	private static readonly LLM_MAX_TOKENS = 4096;

	constructor(
		private readonly providers: ProviderRegistry,
		private readonly developmentFiles: FilesService,
		private readonly chatRouteResolverService: ChatRouteResolverService,
	) {}

	async discover(
		prompt: string,
		projectId: string,
		projectStructure: string[],
		currentRoute: string,
		discoverySystemPrompt: string,
		aiModelId: AiModelEnum,
		abortSignal: AbortSignal,
	): Promise<ContextFile[]> {
		this.logger.log(`🤖 Starting autonomous discovery for: "${prompt.slice(0, 80)}..."`);

		const { structure: normalizedStructure, isNewProject } =
			this.normalizeProjectStructure(projectStructure);
		const collectedFiles: ContextFile[] = [];
		const visitedPaths = new Set<string>();
		const structuresViewed = new Set<string>();

		const initialContext = await this.resolveInitialContext(
			currentRoute,
			normalizedStructure,
			aiModelId,
			abortSignal,
		);

		await this.performDiscoveryLoop(
			{
				prompt,
				initialContext,
				projectStructure: normalizedStructure,
				currentFiles: collectedFiles,
				structuresViewed,
				depth: 0,
				discoverySystemPrompt: discoverySystemPrompt,
			},
			projectId,
			visitedPaths,
			aiModelId,
			abortSignal,
			isNewProject,
		);

		this.logger.log(`\n✨ Discovery completed: ${collectedFiles.length} files`);
		return collectedFiles;
	}

	private async performDiscoveryLoop(
		context: DiscoveryContext,
		projectId: string,
		visitedPaths: Set<string>,
		aiModelId: AiModelEnum,
		abortSignal: AbortSignal,
		isNewProject: boolean,
	): Promise<void> {
		for (let depth = 0; depth < ChatContextDiscoveryService.MAX_DEPTH; depth++) {
			if (context.currentFiles.length >= ChatContextDiscoveryService.MAX_FILES) {
				this.logger.log(
					`⚠️ Max files limit reached (${ChatContextDiscoveryService.MAX_FILES})`,
				);
				break;
			}

			this.logger.log(`\n🔍 Iteration ${depth + 1}/${ChatContextDiscoveryService.MAX_DEPTH}`);

			const action = await this.requestNextActionFromLLM(
				{ ...context, depth },
				aiModelId,
				abortSignal,
			);

			if (!action || action.action === 'done') {
				this.logger.log(`✅ LLM decided exploration is complete at depth ${depth + 1}`);
				break;
			}

			this.logger.log(
				`🎯 Action: ${action.action}${action.target ? ` → ${action.target}` : ''} (${action.reason})`,
			);

			const newFiles = await this.performDiscoveryAction(
				action,
				projectId,
				context.projectStructure,
				visitedPaths,
				context.structuresViewed,
				depth,
				isNewProject,
			);

			if (newFiles.length > 0) {
				context.currentFiles.push(...newFiles);
				this.logger.log(`📄 Added ${newFiles.length} file(s) to context`);
			} else {
				this.logger.log(`⚠️ No new files from action`);
			}
		}
	}

	private async requestNextActionFromLLM(
		context: DiscoveryContext,
		aiModelId: AiModelEnum,
		abortSignal: AbortSignal,
	): Promise<ActionRequest | null> {
		const systemPrompt = this.buildSystemPrompt();
		const userPrompt = this.buildUserPrompt(context);

		let attempts = 0;

		while (attempts < ChatContextDiscoveryService.LLM_MAX_ATTEMPTS) {
			attempts++;

			try {
				const response = await this.providers.generate(
					aiModelId,
					{ prompt: userPrompt },
					{
						maxTokens: ChatContextDiscoveryService.LLM_MAX_TOKENS,
						systemPrompt,
						timeoutMs: ChatContextDiscoveryService.LLM_TIMEOUT_MS,
						abortSignal,
					},
				);

				const action = this.parseActionFromLLMResponse(response.text);

				if (this.isValidAction(action)) {
					return action;
				}

				this.logger.warn(
					`Invalid action from LLM (attempt ${attempts}): ${JSON.stringify(action)}`,
				);
			} catch (error) {
				this.logger.error(
					`LLM action request failed (Attempt ${attempts}/${ChatContextDiscoveryService.LLM_MAX_ATTEMPTS}): ${error.message}`,
				);
			}
		}

		return null;
	}

	private parseActionFromLLMResponse(text: string): ActionRequest | null {
		try {
			let jsonText = text.trim();

			const firstBrace = jsonText.indexOf('{');
			const lastBrace = jsonText.lastIndexOf('}');

			if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
				jsonText = jsonText.substring(firstBrace, lastBrace + 1);
			} else {
				jsonText = jsonText.replace(/```json\n?/g, '').replace(/```/g, '');
				const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					jsonText = jsonMatch[0];
				}
			}

			return JSON.parse(jsonText) as ActionRequest;
		} catch (error) {
			this.logger.error(`Failed to parse LLM response: ${error?.message}`);
			return null;
		}
	}

	private isValidAction(action: ActionRequest | null): boolean {
		if (!action?.action) {
			return false;
		}

		const validActions = ['get_structure', 'open_file', 'search_project', 'done'];
		if (!validActions.includes(action.action)) {
			return false;
		}

		if (action.action === 'done') {
			return true;
		}

		return !!action.target;
	}

	private buildSystemPrompt(): string {
		return [
			'<identity>',
			'  <role>Expert Next.js developer analyzing project structure</role>',
			'  <objective>Autonomously discover and load relevant files to fulfill a development request</objective>',
			'  <approach>Think like a developer: identify patterns, prioritize critical files, gather sufficient context efficiently</approach>',
			'</identity>',
			'',
			'<critical_instruction>',
			'  Your response MUST be ONLY a valid JSON object, with no additional text before or after.',
			'  Format: {"action": "...", "target": "...", "reason": "..."}',
			'</critical_instruction>',
			'',
			'<project_knowledge>',
			'  <technology_stack>',
			'    • Next.js 16 (App Router exclusively)',
			'    • React 19',
			'    • TypeScript',
			'    • Tailwind CSS v4',
			'    • HeroUI (UI component system)',
			'    • Zustand (state management with vanilla stores)',
			'    • Better Auth (authentication)',
			'  </technology_stack>',
			'  <project_structure>',
			'    <frontend>',
			'      src/app/(app)/** → Application pages',
			'      src/components/** → Custom components',
			'      src/stores/** → Zustand stores',
			'      src/interfaces/** → TypeScript interfaces',
			'      src/constants/** → Global constants',
			'    </frontend>',
			'  </project_structure>',
			'</project_knowledge>',
			'',
			'<discovery_strategy>',
			'  1. Identify request type (page, store, component, modification)',
			'  2. Load global constants/configs first',
			'  3. Load required interfaces for data handling',
			'  4. Load dependency files before dependent files',
			'  5. Use get_structure for quick overview, open_file for details',
			'</discovery_strategy>',
			'',
			'<available_actions>',
			'  • get_structure: View file structure only (imports, exports, signatures)',
			'  • open_file: Read complete file content',
			'  • search_project: Find files containing a term',
			'  • done: Finish exploration',
			'</available_actions>',
			'',
			'<constraints>',
			`  • Maximum ${ChatContextDiscoveryService.MAX_FILES} files total`,
			'  • Prioritize efficiency: get_structure before open_file',
			'  • Do not repeat actions on the same file',
			'  • Focus on critical files for the request type',
			'</constraints>',
			'',
			'<response_format>',
			'  Respond with ONLY this JSON:',
			'  {"action": "...", "target": "...", "reason": "..."}',
			'  ',
			'  Examples:',
			'  {"action": "open_file", "target": "src/constants/aqua-constants.ts", "reason": "Need store constant"}',
			'  {"action": "done", "reason": "Have all files needed for implementation"}',
			'</response_format>',
		].join('\n');
	}

	private buildUserPrompt(context: DiscoveryContext): string {
		const filesSummary =
			context.currentFiles.map((f) => `${f.path} (${f.reason})`).join('\n') || 'None yet';

		const contextSection = context.discoverySystemPrompt
			? `\n<additional_context>\n${context.discoverySystemPrompt}\n</additional_context>\n`
			: '';

		return [
			'User request:',
			`"${context.prompt}"`,
			'',
			contextSection,
			context.initialContext ? `Initial context:\n${context.initialContext}\n` : '',
			`Iteration: ${context.depth + 1}/${ChatContextDiscoveryService.MAX_DEPTH}`,
			`Files already loaded: ${context.currentFiles.length}/${ChatContextDiscoveryService.MAX_FILES}`,
			'',
			'Files in current context:',
			filesSummary,
			'',
			'Structures already viewed:',
			context.structuresViewed.size > 0 ? [...context.structuresViewed].join(', ') : 'None',
			'',
			'Project structure (first 200 files):',
			context.projectStructure
				.slice(0, ChatContextDiscoveryService.PROJECT_STRUCTURE_PREVIEW_LIMIT)
				.join('\n'),
			'',
			'REQUIRED ANALYSIS:',
			'1. What type of request is this? (new page, store, component, modification)',
			'2. What key files do I need according to <critical_files_by_request_type>?',
			'3. Do I already have sufficient context to implement?',
			'',
			'As an expert Next.js 16 + App Router developer, what action do you take NOW?',
			'',
			'IMPORTANT: Respond with ONLY the JSON, no additional text. Ensure you generate complete and valid JSON.',
		].join('\n');
	}

	private async performDiscoveryAction(
		action: ActionRequest,
		projectId: string,
		projectStructure: string[],
		visitedPaths: Set<string>,
		structuresViewed: Set<string>,
		depth: number,
		isNewProject: boolean,
	): Promise<ContextFile[]> {
		switch (action.action) {
			case 'get_structure':
				return this.extractFileStructureOnly(
					action.target!,
					projectId,
					structuresViewed,
					action.reason,
					depth,
					isNewProject,
				);

			case 'open_file':
				return this.loadFileContent(
					action.target!,
					projectId,
					visitedPaths,
					action.reason,
					depth,
					isNewProject,
				);

			case 'search_project':
				return this.findFilesContainingTerm(
					action.target!,
					projectId,
					projectStructure,
					visitedPaths,
					action.reason,
					depth,
					isNewProject,
				);

			default:
				return [];
		}
	}

	private async extractFileStructureOnly(
		filePath: string,
		projectId: string,
		structuresViewed: Set<string>,
		reason: string,
		depth: number,
		isNewProject: boolean,
	): Promise<ContextFile[]> {
		if (structuresViewed.has(filePath)) {
			this.logger.debug(`Structure already viewed: ${filePath}`);
			return [];
		}

		try {
			const fileContent = await this.getFileContent(filePath, projectId, isNewProject);
			if (!fileContent) {
				return [];
			}

			const structure = this.parseTypeScriptStructure(fileContent);
			structuresViewed.add(filePath);

			return [
				{
					path: filePath,
					content: structure,
					reason: `structure: ${reason}`,
					depth: depth + 1,
				},
			];
		} catch (error) {
			this.logger.error(`Failed to extract structure from ${filePath}: ${error?.message}`);
			return [];
		}
	}

	private async loadFileContent(
		filePath: string,
		projectId: string,
		visitedPaths: Set<string>,
		reason: string,
		depth: number,
		isNewProject: boolean,
	): Promise<ContextFile[]> {
		if (visitedPaths.has(filePath)) {
			this.logger.debug(`File already loaded: ${filePath}`);
			return [];
		}

		try {
			const fileContent = await this.getFileContent(filePath, projectId, isNewProject);
			if (!fileContent) {
				return [];
			}

			visitedPaths.add(filePath);

			return [
				{
					path: filePath,
					content: fileContent.slice(0, ChatContextDiscoveryService.MAX_FILE_SIZE_BYTES),
					reason: `opened: ${reason}`,
					depth: depth + 1,
				},
			];
		} catch (error) {
			this.logger.error(`Failed to load file ${filePath}: ${error?.message}`);
			return [];
		}
	}

	private async findFilesContainingTerm(
		searchTerm: string,
		projectId: string,
		projectStructure: string[],
		visitedPaths: Set<string>,
		reason: string,
		depth: number,
		isNewProject: boolean,
	): Promise<ContextFile[]> {
		this.logger.log(`🔎 Searching for: "${searchTerm}"`);

		const results: ContextFile[] = [];

		for (const filePath of projectStructure) {
			if (results.length >= ChatContextDiscoveryService.MAX_SEARCH_RESULTS) break;
			if (visitedPaths.has(filePath)) continue;

			try {
				const fileContent = await this.getFileContent(filePath, projectId, isNewProject);
				if (!fileContent || !fileContent.includes(searchTerm)) {
					continue;
				}

				const context = this.extractContextAroundMatches(fileContent, searchTerm);

				results.push({
					path: filePath,
					content: context,
					reason: `search result for "${searchTerm}": ${reason}`,
					depth: depth + 1,
				});

				visitedPaths.add(filePath);
			} catch {}
		}

		this.logger.log(`📌 Found ${results.length} matches for "${searchTerm}"`);
		return results;
	}

	private async getFileContent(
		filePath: string,
		projectId: string,
		isNewProject: boolean,
	): Promise<string | null> {
		try {
			if (isNewProject) {
				const content = this.developmentFiles.getDefaultFileContentByName(filePath);
				if (!content) {
					this.logger.warn(`Default file not found: ${filePath}`);
					return null;
				}
				return content;
			}

			const file = await this.developmentFiles.findFileByProjectIdAndName(
				projectId,
				filePath,
			);
			if (!file) {
				this.logger.warn(`File not found: ${filePath}`);
				return null;
			}
			return file.content;
		} catch (error) {
			this.logger.error(`Error getting file content for ${filePath}: ${error?.message}`);
			return null;
		}
	}

	private normalizeProjectStructure(projectStructure: string[]): {
		structure: string[];
		isNewProject: boolean;
	} {
		const isNewProject = projectStructure.length === 0;
		if (projectStructure.length === 0) {
			return {
				structure: this.developmentFiles.getDefaultFiles().map((d) => d.name),
				isNewProject: true,
			};
		}
		return {
			structure: projectStructure,
			isNewProject,
		};
	}

	private async resolveInitialContext(
		currentRoute: string,
		projectStructure: string[],
		aiModelId: AiModelEnum,
		abortSignal: AbortSignal,
	): Promise<string> {
		if (!currentRoute) {
			return '';
		}

		const resolved = await this.chatRouteResolverService.resolveRoute(
			currentRoute,
			projectStructure,
			aiModelId,
			abortSignal,
		);

		if (resolved) {
			this.logger.log(`📍 Initial context: ${currentRoute}`);
			return `User is on route: ${currentRoute} (file: ${resolved.filePath})`;
		}

		return '';
	}

	private parseTypeScriptStructure(content: string): string {
		try {
			const sourceFile = ts.createSourceFile(
				'temp.ts',
				content,
				ts.ScriptTarget.Latest,
				true,
			);

			const structure: string[] = ['// FILE STRUCTURE\n'];

			const imports: string[] = [];
			sourceFile.statements.forEach((statement) => {
				if (ts.isImportDeclaration(statement)) {
					imports.push(statement.getText(sourceFile));
				}
			});

			if (imports.length > 0) {
				structure.push('// Imports:');
				structure.push(...imports);
				structure.push('');
			}

			sourceFile.statements.forEach((statement) => {
				if (ts.isClassDeclaration(statement)) {
					this.extractClassStructure(statement, sourceFile, structure);
				} else if (ts.isFunctionDeclaration(statement)) {
					this.extractFunctionStructure(statement, sourceFile, structure);
				}
			});

			return structure.join('\n');
		} catch {
			return (
				'// Failed to parse structure\n' +
				content.slice(0, ChatContextDiscoveryService.MAX_STRUCTURE_PREVIEW_BYTES)
			);
		}
	}

	private extractClassStructure(
		statement: ts.ClassDeclaration,
		sourceFile: ts.SourceFile,
		structure: string[],
	): void {
		const className = statement.name?.getText(sourceFile) || 'Anonymous';
		structure.push(`class ${className} {`);

		statement.members.forEach((member) => {
			if (ts.isMethodDeclaration(member)) {
				const methodName = member.name.getText(sourceFile);
				const params = member.parameters.map((p) => p.getText(sourceFile)).join(', ');
				structure.push(`  ${methodName}(${params})`);
			} else if (ts.isPropertyDeclaration(member)) {
				const propName = member.name.getText(sourceFile);
				structure.push(`  ${propName}`);
			}
		});

		structure.push('}\n');
	}

	private extractFunctionStructure(
		statement: ts.FunctionDeclaration,
		sourceFile: ts.SourceFile,
		structure: string[],
	): void {
		const funcName = statement.name?.getText(sourceFile) || 'anonymous';
		const params = statement.parameters.map((p) => p.getText(sourceFile)).join(', ');
		structure.push(`function ${funcName}(${params})\n`);
	}

	private extractContextAroundMatches(content: string, searchTerm: string): string {
		const lines = content.split('\n');
		const matches: string[] = [];

		lines.forEach((line, idx) => {
			if (line.includes(searchTerm)) {
				const start = Math.max(
					0,
					idx - ChatContextDiscoveryService.CONTEXT_LINES_AROUND_MATCH,
				);
				const end = Math.min(
					lines.length,
					idx + ChatContextDiscoveryService.CONTEXT_LINES_AROUND_MATCH + 1,
				);

				matches.push(`// Line ${idx + 1}:`);
				matches.push(...lines.slice(start, end));
				matches.push('');
			}
		});

		return matches.join('\n');
	}
}
