import { Injectable, Logger } from '@nestjs/common';
import { ProviderRegistry } from '@aquacode/common/ai';
import { BadRequestException } from '@aquacode/common/exceptions';
import { ProjectErrors } from '../errors';

export interface ProjectEnrichmentResult {
	name: string;
	description: string;
}

@Injectable()
export class ProjectEnrichmentService {
	private static readonly LLM_MAX_ATTEMPTS = 2;

	private readonly logger = new Logger(ProjectEnrichmentService.name);

	constructor(private readonly providers: ProviderRegistry) {}

	async enrichProject(
		name: string | null,
		description: string,
		number: number,
		modelId: string,
	): Promise<ProjectEnrichmentResult> {
		const systemPrompt = this.buildLLMSystemPrompt();
		const userPrompt = this.buildLLMUserPrompt(name, description, number);

		let attempts = 0;

		while (attempts < ProjectEnrichmentService.LLM_MAX_ATTEMPTS) {
			attempts++;

			try {
				const res = await this.providers.generate(
					modelId,
					{ prompt: userPrompt },
					{ maxTokens: 1000, systemPrompt },
				);

				const parsed = this.parseModelOutput(res.text);
				if (parsed) return parsed;

				throw new BadRequestException({ errors: ProjectErrors.PROJECT_INVALID_LLM_OUTPUT });
			} catch (e) {
				this.logger.error(
					`Attempt ${attempts} failed to enrich project: modelId=${modelId}, name="${name}", description="${description}", number=${number}`,
					e instanceof Error ? e.stack : e,
				);
			}
		}

		throw new BadRequestException({ errors: ProjectErrors.PROJECT_ENRICHMENT_FAILED });
	}

	private buildLLMSystemPrompt(): string {
		return [
			'<identity>',
			'  <role>Expert in web application naming and branding</role>',
			'  <objective>Create unique names and compelling descriptions for web projects</objective>',
			'</identity>',
			'',
			'<core_directives>',
			'  <language_detection>',
			"    CRITICAL: Detect the language of the user's description and respond in THAT SAME language.",
			'    Rules:',
			'    • English description → English name and description',
			'    • Spanish description → Spanish name and description',
			'    • French description → French name and description',
			'  </language_detection>',
			'  ',
			'  <functionality_focus>',
			'    Understand the FUNCTIONALITY of what the user wants, not literally repeat their message.',
			'    Transform creation requests into functional names.',
			'  </functionality_focus>',
			'',
			'  <trademark_policy>',
			'    CRITICAL: If the user request mentions a specific TRADEMARK, BRAND, or FAMOUS FRANCHISE (e.g., Harry Potter, Star Wars, Marvel):',
			'    1. Do NOT use the trademarked name in the "slug-name".',
			'    2. Do NOT use the trademarked name in the "description".',
			'    3. Instead, distill the request into its GENRE or THEME.',
			'    ',
			'    Examples:',
			'    ❌ Input: "Harry Potter app" → Output Name: "harry-potter-ten"',
			'    ✅ Input: "Harry Potter app" → Output Name: "magic-school-ten" (Theme: Magic)',
			'    ✅ Input: "App like Uber" → Output Name: "ride-share-five" (Function: Transport)',
			'  </trademark_policy>',
			'</core_directives>',
			'',
			'<output_format>',
			'  <structure>',
			'    MANDATORY JSON format (no markdown, no code blocks, no backticks):',
			'    {"name": "slug-name", "description": "Creative description"}',
			'  </structure>',
			'  ',
			'  <name_rules>',
			'    Format: [word1]-[word2]-[number-word]',
			'    Constraints:',
			'    • EXACTLY 3 words separated by hyphens',
			'    • Lowercase slug format',
			"    • ALL words in the SAME language as user's input",
			'    ',
			'    Word selection:',
			'    • First 2 words: Reflect FUNCTION/PURPOSE or THEME',
			'    • Third word: Provided number converted to word form',
			'    ',
			'    Forbidden words:',
			'    • Generic: "app", "application", "aplicación"',
			'    • Action verbs: "create", "make", "crear", "hacer"',
			'  </name_rules>',
			'  ',
			'  <number_conversion>',
			'    Convert the provided number to its word form in the target language.',
			'    CRITICAL: Concatenate compound numbers directly without spaces or extra hyphens.',
			'    ',
			'    Examples:',
			'    • 21 (ES) → veintiuno',
			'    • 31 (ES) → treintayuno (NOT treinta-y-uno)',
			'    • 45 (ES) → cuarentaycinco',
			'    • 100 (ES) → cien',
			'  </number_conversion>',
			'  ',
			'  <description_rules>',
			'    • Length: 40-80 characters maximum',
			"    • Language: SAME as user's input",
			'    • Focus on VALUE and THEME, avoiding specific trademarks.',
			'  </description_rules>',
			'</output_format>',
			'',
			'<examples>',
			'  <spanish_examples>',
			'    Input: "Crear una tienda online", Number: 10',
			'    ✅ {"name": "tienda-express-diez", "description": "Tu tienda online lista para vender"}',
			'    ',
			'    Input: "App del universo Harry Potter", Number: 31',
			'    ✅ {"name": "mundo-magico-treintayuno", "description": "Hechizos y fantasía en tu bolsillo"}',
			'  </spanish_examples>',
			'</examples>',
			'',
			'<output_instructions>',
			'  Respond with ONLY the raw JSON object.',
			'  No markdown formatting.',
			'  No code blocks.',
			'  No backticks.',
			'</output_instructions>',
		].join('\n');
	}

	private buildLLMUserPrompt(name: string | null, description: string, number: number): string {
		return `Name: ${name}, Description: ${description}, Number: ${number}`;
	}

	private parseModelOutput(text: string): ProjectEnrichmentResult | null {
		try {
			let cleanText = text.trim();

			if (cleanText.startsWith('```')) {
				cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '');
				cleanText = cleanText.replace(/\n?```\s*$/, '');
			}

			const obj = JSON.parse(cleanText);
			if (obj && typeof obj.name === 'string' && typeof obj.description === 'string') {
				return { name: obj.name, description: obj.description };
			}
			return null;
		} catch {
			return null;
		}
	}
}
