import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatParseAquaBlocksService {
	parseAquaBlocks(text: string) {
		const blocks: Array<{ name: string; data: any }> = [];
		if (!text) return blocks;
		const tagRegex = /<aqua-tool-use\b([\s\S]*?)>([\s\S]*?)<\/aqua-tool-use>/gi;
		let m: RegExpExecArray | null;

		const decodeEntities = (s: string): string =>
			s
				.replace(/&quot;|&#34;/g, '"')
				.replace(/&#39;|&apos;/g, "'")
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>');

		const tryParseJson = (raw: string): any => {
			try {
				return JSON.parse(raw);
			} catch {
				/* fallthrough */
			}
			try {
				return JSON.parse(raw.replace(/'(.*?)'/g, '"$1"'));
			} catch {
				/* fallthrough */
			}
			return null;
		};

		const extractJsonByBraces = (s: string): string | null => {
			const start = s.indexOf('{');
			if (start < 0) return null;
			let i = start + 1;
			let depth = 1;
			while (i < s.length && depth > 0) {
				const ch = s[i++];
				if (ch === '{') depth++;
				else if (ch === '}') depth--;
			}
			if (depth === 0) return s.slice(start, i);
			return null;
		};

		while ((m = tagRegex.exec(text))) {
			const attrs = m[1] || '';
			const inner = m[2] || '';
			const nameMatch = attrs.match(/name\s*=\s*(["'])([^"']+)\1/i);
			const name = nameMatch ? nameMatch[2] : '';
			let data: any = null;

			// Try quoted data attribute first (double or single quotes)
			const quotedDataMatch = attrs.match(/data\s*=\s*(["'])([\s\S]*?)\1/i);
			if (quotedDataMatch) {
				const quoted = decodeEntities(quotedDataMatch[2]);
				const jsonStr = extractJsonByBraces(quoted) ?? quoted;
				data = tryParseJson(jsonStr);
			}

			// Fallback: unquoted attribute with brace scanning after data=
			if (!data) {
				const dataIdx = attrs.search(/data\s*=/i);
				if (dataIdx >= 0) {
					const after = decodeEntities(attrs.slice(dataIdx));
					const jsonStr = extractJsonByBraces(after);
					if (jsonStr) {
						data = tryParseJson(jsonStr);
					}
				}
			}

			// Last resort: search JSON inside the tag body/content
			if (!data && inner && inner.trim()) {
				const innerDecoded = decodeEntities(inner);
				const jsonStr = extractJsonByBraces(innerDecoded);
				if (jsonStr) data = tryParseJson(jsonStr);
			}

			if (name) {
				// If we have structured data, use it; otherwise use the inner text content
				if (data && typeof data === 'object') {
					blocks.push({ name, data });
				} else if (inner && inner.trim()) {
					// Use the inner text content as the data when no JSON data is available
					blocks.push({ name, data: inner.trim() });
				} else {
					// Include blocks with name only if no content is available
					blocks.push({ name, data: null });
				}
			}
		}

		return blocks;
	}
}
