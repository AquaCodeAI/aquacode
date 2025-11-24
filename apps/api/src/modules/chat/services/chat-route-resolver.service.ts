import { Injectable, Logger } from '@nestjs/common';
import { AiModelEnum, ProviderRegistry } from '@aquacode/common';

export interface ResolvedRoute {
	filePath: string;
	routePath: string;
	matchType: 'exact' | 'fuzzy' | 'llm-assisted';
}

interface RouteCandidate {
	file: string;
	score: number;
	filePath: string;
}

@Injectable()
export class ChatRouteResolverService {
	private readonly logger = new Logger(ChatRouteResolverService.name);

	// Scoring weights for fuzzy matching
	private static readonly EXACT_SEGMENT_MATCH_SCORE = 10;
	private static readonly DYNAMIC_SEGMENT_MATCH_SCORE = 5;
	private static readonly SEGMENT_COUNT_PENALTY = 3;
	private static readonly MIN_SCORE_THRESHOLD = 0;

	// LLM configuration
	private static readonly LLM_MAX_TOKENS = 150;
	private static readonly MAX_FILES_FOR_LLM = 50;

	// Next.js route patterns
	private static readonly PAGE_FILE_PATTERNS = [/\/page\.tsx?$/, /\/page\.jsx?$/];

	constructor(private readonly providers: ProviderRegistry) {}

	/**
	 * Resolves a URL route to its corresponding file path
	 * Tries exact match → fuzzy match → LLM-assisted match
	 */
	async resolveRoute(
		route: string,
		projectStructure: string[],
		aiModelId: AiModelEnum,
		abortSignal: AbortSignal,
	): Promise<ResolvedRoute | null> {
		this.logger.debug(`Resolving route: ${route}`);

		const exactMatch = this.findExactMatch(route, projectStructure);
		if (exactMatch) {
			this.logger.debug(`Found exact match: ${exactMatch}`);
			return this.createResolvedRoute(exactMatch, route, 'exact');
		}

		const fuzzyMatch = this.findFuzzyMatch(route, projectStructure);
		if (fuzzyMatch) {
			this.logger.debug(`Found fuzzy match: ${fuzzyMatch}`);
			return this.createResolvedRoute(fuzzyMatch, route, 'fuzzy');
		}

		const llmMatch = await this.findLLMAssistedMatch(
			route,
			projectStructure,
			aiModelId,
			abortSignal,
		);
		if (llmMatch) {
			this.logger.debug(`Found LLM-assisted match: ${llmMatch}`);
			return this.createResolvedRoute(llmMatch, route, 'llm-assisted');
		}

		this.logger.warn(`No match found for route: ${route}`);
		return null;
	}

	private findExactMatch(route: string, structure: string[]): string | null {
		const normalizedRoute = this.normalizeRoute(route);
		const patterns = this.buildExactMatchPatterns(normalizedRoute);

		for (const pattern of patterns) {
			if (structure.includes(pattern)) {
				return pattern;
			}
		}

		return null;
	}

	private buildExactMatchPatterns(normalizedRoute: string): string[] {
		const isRoot = normalizedRoute === '';

		return [
			isRoot ? 'src/app/(app)/page.tsx' : `src/app/(app)/${normalizedRoute}/page.tsx`,
			isRoot ? 'src/app/page.tsx' : `src/app/${normalizedRoute}/page.tsx`,
		];
	}

	private findFuzzyMatch(route: string, structure: string[]): string | null {
		const normalizedRoute = this.normalizeRoute(route);
		const routeSegments = this.splitIntoSegments(normalizedRoute);

		const pageFiles = this.filterPageFiles(structure);
		const candidates = this.scoreCandidates(pageFiles, routeSegments);

		if (candidates.length === 0) {
			return null;
		}

		return candidates[0].file;
	}

	private scoreCandidates(pageFiles: string[], routeSegments: string[]): RouteCandidate[] {
		return pageFiles
			.map((file) => {
				const filePath = this.extractRoutePathFromFile(file);
				const fileSegments = this.splitIntoSegments(filePath);
				const score = this.calculateMatchScore(routeSegments, fileSegments);

				return { file, score, filePath };
			})
			.filter((c) => c.score > ChatRouteResolverService.MIN_SCORE_THRESHOLD)
			.sort((a, b) => b.score - a.score);
	}

	private calculateMatchScore(routeSegments: string[], fileSegments: string[]): number {
		let score = 0;

		routeSegments.forEach((segment, idx) => {
			if (fileSegments[idx] === segment) {
				score += ChatRouteResolverService.EXACT_SEGMENT_MATCH_SCORE;
			} else if (fileSegments[idx] === '*') {
				score += ChatRouteResolverService.DYNAMIC_SEGMENT_MATCH_SCORE;
			}
		});

		const segmentDiff = Math.abs(routeSegments.length - fileSegments.length);
		score -= segmentDiff * ChatRouteResolverService.SEGMENT_COUNT_PENALTY;

		return score;
	}

	private extractRoutePathFromFile(file: string): string {
		return file
			.replace(/^src\/app\//, '')
			.replace(/\/page\.tsx?$/, '')
			.replace(/\(app\)\//, '')
			.replace(/\(marketing\)\//, '')
			.replace(/\(admin\)\//, '')
			.replace(/\(auth\)\//, '')
			.replace(/\[.*?\]/g, '*');
	}

	private async findLLMAssistedMatch(
		route: string,
		structure: string[],
		aiModelId: AiModelEnum,
		abortSignal: AbortSignal,
	): Promise<string | null> {
		const pageFiles = this.filterPageFiles(structure);

		if (pageFiles.length === 0) {
			return null;
		}

		try {
			const systemPrompt = this.buildLLMSystemPrompt();
			const userPrompt = this.buildLLMUserPrompt(route, pageFiles);

			const response = await this.providers.generate(
				aiModelId,
				{ prompt: userPrompt },
				{
					maxTokens: ChatRouteResolverService.LLM_MAX_TOKENS,
					systemPrompt,
					abortSignal,
				},
			);

			const filePath = response.text.trim();

			if (this.isValidLLMResponse(filePath, structure)) {
				return filePath;
			}

			return null;
		} catch (error) {
			this.logger.error(`LLM-assisted route resolution failed: ${error.message}`);
			return null;
		}
	}

	private buildLLMSystemPrompt(): string {
		return [
			'<identity>',
			'  <role>Next.js App Router routing expert</role>',
			'  <objective>Map URL routes to their corresponding page file paths</objective>',
			'  <framework>Next.js 15+ App Router conventions</framework>',
			'</identity>',
			'',
			'<routing_conventions>',
			'  <nextjs_mapping>',
			'    / → src/app/(app)/page.tsx',
			'    /profile → src/app/(app)/profile/page.tsx',
			'    /products/123 → src/app/(app)/products/[id]/page.tsx',
			'  </nextjs_mapping>',
			'  ',
			'  <route_groups>',
			'    Route groups (app), (marketing) DO NOT affect URL',
			'    src/app/(app)/profile/page.tsx → URL: /profile',
			'  </route_groups>',
			'  ',
			'  <dynamic_segments>',
			'    [id] → Matches any single segment',
			'    [...slug] → Matches multiple segments',
			'    [[...slug]] → Optional catch-all',
			'  </dynamic_segments>',
			'</routing_conventions>',
			'',
			'<matching_rules>',
			'  Priority order:',
			'  1. Exact static match',
			'  2. Dynamic segment match',
			'  3. Catch-all match',
			'  ',
			'  Prefer:',
			'  • Files in src/app/(app)/**',
			'  • Most specific file (fewest wildcards)',
			'  • Matching segment count',
			'</matching_rules>',
			'',
			'<examples>',
			'  URL: "/" → src/app/(app)/page.tsx',
			'  URL: "/profile" → src/app/(app)/profile/page.tsx',
			'  URL: "/products/123" → src/app/(app)/products/[id]/page.tsx',
			'  URL: "/non-existent" → null',
			'</examples>',
			'',
			'<output_format>',
			'  Return ONLY the file path or "null":',
			'  ',
			'  ✅ src/app/(app)/profile/page.tsx',
			'  ✅ null',
			'  ',
			'  ❌ NO explanations, markdown, or code blocks',
			'</output_format>',
		].join('\n');
	}

	private buildLLMUserPrompt(route: string, pageFiles: string[]): string {
		const limitedFiles = pageFiles.slice(0, ChatRouteResolverService.MAX_FILES_FOR_LLM);

		return [
			`User's URL route: "${route}"`,
			'',
			'Available page files in project:',
			limitedFiles.join('\n'),
			'',
			'Which file corresponds to this route?',
		].join('\n');
	}

	private isValidLLMResponse(filePath: string, structure: string[]): boolean {
		return !!filePath && filePath !== 'null' && structure.includes(filePath);
	}

	private normalizeRoute(route: string): string {
		return route.replace(/^\//, '').replace(/\/$/, '');
	}

	private splitIntoSegments(path: string): string[] {
		return path.split('/').filter(Boolean);
	}

	private filterPageFiles(structure: string[]): string[] {
		return structure.filter((file) =>
			ChatRouteResolverService.PAGE_FILE_PATTERNS.some((pattern) => pattern.test(file)),
		);
	}

	private createResolvedRoute(
		filePath: string,
		routePath: string,
		matchType: 'exact' | 'fuzzy' | 'llm-assisted',
	): ResolvedRoute {
		return {
			filePath,
			routePath,
			matchType,
		};
	}
}
