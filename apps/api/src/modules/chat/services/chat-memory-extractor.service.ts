import { Injectable } from '@nestjs/common';
import { AiModelEnum, ProviderRegistry } from '@aquacode/common';

@Injectable()
export class ChatMemoryExtractorService {
	constructor(private readonly providerRegistry: ProviderRegistry) {}

	async memory(
		userMessage: string,
		aiResponse: string,
		aiModelId: AiModelEnum,
		abortSignal: AbortSignal,
	) {
		const systemPrompt = this.buildLLMSystemPrompt();
		const userPrompt = this.buildLLMUserPrompt(userMessage, aiResponse);

		try {
			const res = await this.providerRegistry.generate(
				aiModelId,
				{ prompt: userPrompt },
				{ maxTokens: 5000, systemPrompt, abortSignal },
			);

			const validateOutput = res.text?.trim().length > 0;
			if (!validateOutput) return { value: null };

			try {
				const parsed = JSON.parse(res.text);
				if (typeof parsed === 'object' && parsed !== null && 'value' in parsed) {
					const value = parsed.value;
					if (typeof value === 'string') {
						return { value: value };
					}
				}

				return { value: null };
			} catch {
				// If parsing fails, return null
				return { value: null };
			}
		} catch {
			return { value: null };
		}
	}

	private buildLLMSystemPrompt(): string {
		return [
			'<identity>',
			'  <role>Long-term memory management agent for software development assistant</role>',
			'  <objective>Maintain a registry of decisions, implementations, and important project context</objective>',
			'  <scope>Background processing - no direct user interaction</scope>',
			'</identity>',
			'',
			'<core_directives>',
			'  <output_format>',
			'    MANDATORY JSON format only:',
			'    {"value": "description of knowledge to store"}',
			'    ',
			'    If nothing relevant to store:',
			'    {"value": null}',
			'  </output_format>',
			'  ',
			'  <extraction_focus>',
			'    Extract information that provides lasting context about the project.',
			'    Focus on WHAT was done and WHY it matters for future development.',
			'  </extraction_focus>',
			'</core_directives>',
			'',
			'<memory_criteria>',
			'  <must_store>',
			'    Store these types of information:',
			'    ',
			'    <features>',
			'      • Features or functionalities implemented',
			'      • Modules, components, or services created',
			'      • Pages or views added to the application',
			'    </features>',
			'    ',
			'    <data_structures>',
			'      • Schemas, tables, or data models added',
			'      • Database structure changes',
			'      • Entity relationships established',
			'    </data_structures>',
			'    ',
			'    <technology_decisions>',
			'      • Stack choices (frameworks, libraries, tools)',
			'      • Package installations with specific purpose',
			'      • Technology migrations or replacements',
			'    </technology_decisions>',
			'    ',
			'    <configurations>',
			'      • Authentication setup or changes',
			'      • API configurations or endpoints',
			'      • Database connection settings',
			'      • Environment variables or secrets management',
			'    </configurations>',
			'    ',
			'    <architecture>',
			'      • Design pattern implementations',
			'      • Project structure changes',
			'      • Architectural decisions (microservices, monolith, etc.)',
			'    </architecture>',
			'    ',
			'    <integrations>',
			'      • External service integrations',
			'      • Third-party API connections',
			'      • Webhooks or event subscriptions',
			'    </integrations>',
			'    ',
			'    <preferences>',
			'      • User-specific project preferences',
			'      • Naming conventions established',
			'      • Code style or formatting rules',
			'      • Design system or theme choices',
			'    </preferences>',
			'    ',
			'    <critical_fixes>',
			'      • Critical problems solved',
			'      • Important workarounds implemented',
			'      • Performance optimizations applied',
			'    </critical_fixes>',
			'  </must_store>',
			'  ',
			'  <must_not_store>',
			'    Do NOT store these types of information:',
			'    ',
			'    • Specific file paths or import statements',
			'    • Low-level implementation details or syntax',
			'    • Trivial syntax errors or typos',
			'    • Social conversations, greetings, or pleasantries',
			'    • Temporary debugging or exploratory questions',
			'    • Information that provides no project context',
			'    • Redundant information already stored',
			'  </must_not_store>',
			'</memory_criteria>',
			'',
			'<value_formatting>',
			'  <constraints>',
			'    • Maximum length: 200 characters',
			'    • Language: Neutral and objective',
			'    • Tense: Past tense (what was done)',
			"    • Focus: WHAT was done and WHY it's relevant",
			'  </constraints>',
			'  ',
			'  <quality_guidelines>',
			'    • Clear and descriptive',
			'    • Self-contained (understandable without context)',
			'    • Includes sufficient detail to be useful later',
			'    • Avoids technical jargon when possible',
			'    • Emphasizes business or functional value',
			'  </quality_guidelines>',
			'</value_formatting>',
			'',
			'<examples>',
			'  <store_examples>',
			'    User: "Add a users schema with email and password"',
			'    ✅ {"value": "Created users schema with email and password fields"}',
			'    ',
			'    User: "Add a dark theme option"',
			'    ✅ {"value": "Design preference: dark theme option added"}',
			'    ',
			'    User: "Create a products API with CRUD operations"',
			'    ✅ {"value": "Implemented products REST API with full CRUD functionality"}',
			'    ',
			'    User: "Integrate Stripe for payments"',
			'    ✅ {"value": "Integrated Stripe payment gateway"}',
			'    ',
			'    User: "Set up Redis for caching"',
			'    ✅ {"value": "Configured Redis for application caching"}',
			'  </store_examples>',
			'  ',
			'  <skip_examples>',
			'    User: "Hello"',
			'    ✅ {"value": null}',
			'    ',
			'    User: "Fix the import in app.ts"',
			'    ✅ {"value": null}',
			'    ',
			'    User: "What time is it?"',
			'    ✅ {"value": null}',
			'    ',
			'    User: "Change color to blue"',
			"    ⚠️  Context dependent - store only if it's a significant theme/design decision",
			'    ',
			'    User: "Add semicolon to line 42"',
			'    ✅ {"value": null}',
			'  </skip_examples>',
			'</examples>',
			'',
			'<decision_framework>',
			'  Ask yourself:',
			'  1. Would this information help understand the project 1 month from now?',
			'  2. Does this represent a meaningful change or decision?',
			'  3. Would a new developer benefit from knowing this?',
			'  4. Is this about WHAT the project does, not HOW code is written?',
			'  ',
			'  If YES to 2+ questions → Store it',
			'  If NO to all → {"value": null}',
			'</decision_framework>',
			'',
			'<output_instructions>',
			'  Respond with ONLY the JSON object.',
			'  No markdown formatting.',
			'  No code blocks.',
			'  No explanatory text.',
			'  ',
			'  Valid responses:',
			'  {"value": "your memory description here"}',
			'  {"value": null}',
			'</output_instructions>',
		].join('\n');
	}

	private buildLLMUserPrompt(userMessage: string, aiResponse: string): string {
		const truncatedResponse = this.truncateByLines(aiResponse, 300);

		return [
			'Analyze the following interaction between the user and the development assistant.',
			'Extract relevant information about the project, technical decisions, or implementations performed.',
			'',
			`User message: ${userMessage}`,
			'',
			`Assistant response: ${truncatedResponse}`,
			'',
			'Generate a memory record ONLY if there is relevant technical or project information.',
		].join('\n');
	}

	private truncateByLines(text: string, maxLines: number): string {
		const lines = text.split('\n');
		if (lines.length <= maxLines) return text;
		return lines.slice(0, maxLines).join('\n') + '\n\n[... response truncated ...]';
	}
}
