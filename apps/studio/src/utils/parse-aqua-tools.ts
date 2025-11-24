/**
 * Aqua Tool Use Utility
 *
 * Extracts and categorizes <aqua-tool-use> blocks from streaming AI responses.
 * Designed to work in real-time as content arrives incrementally.
 *
 * Example tag structure:
 * <aqua-tool-use name="aqua-think">
 *   Content here...
 * </aqua-tool-use>
 */
export type AquaToolName = 'aqua-think' | 'aqua-schema' | 'aqua-policy' | 'aqua-write' | 'aqua-summarize';

export interface AquaToolBlock {
  id: string;
  name: AquaToolName;
  content: string;
  isCompleted: boolean;
}

export interface AquaToolSections {
  think: AquaToolBlock[];
  schemas: AquaToolBlock[];
  policies: AquaToolBlock[];
  write: AquaToolBlock[];
  summary: AquaToolBlock[];
}

/**
 * Extracts the name attribute from a tag
 * Example: '<aqua-tool-use name="aqua-think">' → 'aqua-think'
 */
function extractNameAttribute(tag: string): string {
  const match = tag.match(/name="([^"]*)"/);
  return match ? match[1] : '';
}

/**
 * Maps tool names to their corresponding section keys
 */
function getSectionKey(name: AquaToolName): keyof AquaToolSections {
  const mapping: Record<AquaToolName, keyof AquaToolSections> = {
    'aqua-think': 'think',
    'aqua-write': 'write',
    'aqua-summarize': 'summary',
    'aqua-schema': 'schemas',
    'aqua-policy': 'policies',
  };
  return mapping[name];
}

/**
 * Checks if a string is a valid tool name
 */
function isValidToolName(name: string): name is AquaToolName {
  const validNames: AquaToolName[] = ['aqua-think', 'aqua-schema', 'aqua-policy', 'aqua-write', 'aqua-summarize'];
  return validNames.includes(name as AquaToolName);
}

/**
 * Parses aqua-tool-use blocks from AI response content
 *
 * This function is designed to be called repeatedly as content streams in.
 * It extracts content even from incomplete blocks, enabling real-time updates.
 *
 * How it works:
 * 1. Finds all <aqua-tool-use> tags in the content
 * 2. Extracts the name and content from each tag
 * 3. Detects if block is complete (has closing tag) or still streaming
 * 4. Categorizes blocks into their respective sections
 *
 * @param content - Raw streaming content from AI (can be partial/incomplete)
 * @returns Categorized sections with extracted blocks
 *
 * @example
 * // As content streams in:
 * // Step 1: "<aqua-tool-use name=\"aqua-think\">Starting"
 * // → Returns: { think: [{ content: "Starting", isCompleted: false }] }
 *
 * // Step 2: "<aqua-tool-use name=\"aqua-think\">Starting to think..."
 * // → Returns: { think: [{ content: "Starting to think...", isCompleted: false }] }
 *
 * // Step 3: "<aqua-tool-use name=\"aqua-think\">Starting to think...</aqua-tool-use>"
 * // → Returns: { think: [{ content: "Starting to think...", isCompleted: true }] }
 */
export function parseAquaTools(content: string): { sections: AquaToolSections } {
  const sections: AquaToolSections = {
    think: [],
    schemas: [],
    policies: [],
    write: [],
    summary: [],
  };

  if (!content) {
    return { sections };
  }

  let remaining = content;
  let blockIndex = 0;

  // Process each aqua-tool-use block in the content
  while (remaining.length > 0) {
    // Find the next opening tag
    const openingMatch = remaining.match(/<aqua-tool-use([^>]*)/);

    if (!openingMatch) {
      break; // No more tags found
    }

    const tagStart = openingMatch.index!;
    const partialTag = `<aqua-tool-use${openingMatch[1]}`;

    // Extract and validate the tool name
    const toolName = extractNameAttribute(partialTag);

    if (!isValidToolName(toolName)) {
      // Skip this tag if name is invalid or not recognized yet
      remaining = remaining.substring(tagStart + openingMatch[0].length);
      continue;
    }

    // Find where the content starts (after the closing >)
    const completeOpeningMatch = remaining.match(/<aqua-tool-use[^>]*>/);
    let contentStart: number;

    if (completeOpeningMatch && completeOpeningMatch.index === tagStart) {
      contentStart = tagStart + completeOpeningMatch[0].length;
    } else {
      contentStart = tagStart + partialTag.length;
    }

    // Extract content between opening and closing tags
    const afterOpening = remaining.substring(contentStart);
    const closingIndex = afterOpening.indexOf('</aqua-tool-use>');

    let blockContent: string;
    let isCompleted: boolean;

    if (closingIndex !== -1) {
      // Complete block: has closing tag
      blockContent = afterOpening.substring(0, closingIndex);
      remaining = afterOpening.substring(closingIndex + '</aqua-tool-use>'.length);
      isCompleted = true;
    } else {
      // Incomplete block: still streaming, no closing tag yet
      blockContent = afterOpening;
      remaining = '';
      isCompleted = false;
    }

    // Create the block
    const block: AquaToolBlock = {
      id: `block-${blockIndex++}`,
      name: toolName,
      content: blockContent.trim(),
      isCompleted,
    };

    // Add to the appropriate section
    const sectionKey = getSectionKey(toolName);
    sections[sectionKey].push(block);
  }

  return { sections };
}
