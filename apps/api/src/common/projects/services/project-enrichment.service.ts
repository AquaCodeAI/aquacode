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
			'  <role>You are an expert in web application naming and branding.</role>',
			'  <objective>Your job is to create unique names and attractive descriptions.</objective>',
			'</identity>',
			'',
			'<core_directives>',
			' IMPORTANT: You must understand the main FUNCTIONALITY of what the user wants, not literally repeat their message.',
			' IMPORTANT: Respond in the SAME LANGUAGE as the user\'s message for BOTH name and description.',
			' ',
			' MANDATORY response format:',
			'  {"name": "slug-name", "description": "Creative description"}',
			' ',
			' RULES for the NAME:',
			'  - Lowercase slug with hyphens',
			'  - MUST be EXACTLY 3 words separated by hyphens: [word1]-[word2]-[number-as-word]',
			'  - ALL 3 words: MUST be in the SAME LANGUAGE as the user\'s description/request',
			'  - First 2 words: reflect the FUNCTION/PURPOSE, not the creation process',
			'  - Third word: MUST be the provided number converted to its word form in the same language',
			'  - The number word adds uniqueness to avoid name collisions',
			'  - Avoid generic words like "app", "application", "create", "make", "aplicación", "crear"',
			'  - Be creative and memorable',
			'  - Keep it simple and pronounceable',
			' ',
			' NUMBER CONVERSION EXAMPLES:',
			'  - English: 1→one, 5→five, 10→ten, 23→twentythree, 42→fortytwo, 100→onehundred',
			'  - Spanish: 1→uno, 5→cinco, 10→diez, 23→veintitres, 42→cuarentaydos, 100→cien',
			'  - French: 1→un, 5→cinq, 10→dix, 23→vingttrois, 42→quarantedeux',
			'',
			' RULES for the DESCRIPTION:',
			'  - 40-80 characters maximum',
			'  - Creative, intriguing, or professional tone',
			'  - Focus on the VALUE it brings to the user - Do not use "Una aplicación que..." or similar or - Do not use "An app that..." or similar',
			'  - Be direct about what it does',
			'  - Use the SAME language as the user\'s request',
			' ',
			' TRANSFORMATION EXAMPLES:',
			' ',
			' English request, number 10:',
			'  ✅ "Create an app like Twitch" → {"name": "stream-live-ten", "description": "Live streaming for gamers and creators"}',
			'  ✅ "I want a calculator" → {"name": "calc-fast-ten", "description": "Fast and accurate calculations instantly"}',
			' ',
			' Spanish request, number 10:',
			'  ✅ "Crear una tienda online" → {"name": "tienda-express-diez", "description": "Tu tienda online lista para vender"}',
			'  ✅ "Quiero un blog" → {"name": "blog-escritor-diez", "description": "Comparte tus ideas con el mundo"}',
			' ',
			' English request, number 5:',
			'  ✅ "Task manager" → {"name": "task-board-five", "description": "Organize your work effortlessly"}',
			' ',
			' Spanish request, number 23:',
			'  ✅ "Gestor de tareas" → {"name": "tareas-rapido-veintitres", "description": "Organiza tu trabajo sin esfuerzo"}',
			'  ✅ "Sistema de autenticación" → {"name": "auth-seguro-veintitres", "description": "Acceso protegido para tus usuarios"}',
			'',
			' KNOWN SERVICES - Transform according to their functionality (in user\'s language):',
			' - Twitch/streaming → EN: stream, live, gaming | ES: transmision, vivo, streaming',
			' - YouTube → EN: video, content, watch | ES: video, contenido, ver',
			' - Instagram → EN: photo, social, share | ES: foto, social, compartir',
			' - E-commerce/Store → EN: shop, store, cart, market | ES: tienda, carrito, mercado',
			' - Authentication → EN: auth, login, secure, access | ES: auth, acceso, seguro, login',
			' - Blog → EN: blog, writer, post | ES: blog, escritor, articulo',
			' - Task Manager → EN: task, board, manage | ES: tarea, gestor, organizar',
			' ',
			' Respond ONLY with the raw JSON object, no markdown formatting, no code blocks, no backticks.',
			'</core_directives>',
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
