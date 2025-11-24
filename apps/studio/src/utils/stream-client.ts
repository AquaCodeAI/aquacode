import { AQUA_SESSION_TOKEN } from '@/constants/aqua-constants';
import { getLocalStorageItem } from '@/utils/local-storage';

export interface SSEEvent<T = unknown> {
  eventName: string;
  eventData: T;
}

export class StreamingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StreamingError';
  }
}

const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB limit for safety
const BUFFER_TRIM_SIZE = 512 * 1024; // Keep the last 512 KB when trimming

/**
 * Efficient SSE parser that processes chunks incrementally
 * without excessive string concatenation
 */
export async function* parseSSEStream<T = unknown>(
  stream: ReadableStream<Uint8Array>,
  abortSignal?: AbortSignal
): AsyncGenerator<SSEEvent<T>, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      // Check if the operation was aborted
      if (abortSignal?.aborted) {
        throw new DOMException('Stream was aborted', 'AbortError');
      }

      const { done, value } = await reader.read();

      if (done) {
        // Process any remaining data in buffer
        if (buffer.trim()) {
          const event = parseSSEEvent<T>(buffer);
          if (event) {
            yield event;
          }
        }
        break;
      }

      // Decode chunk and add to buffer
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete events
      let eventEndIndex: number;
      while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
        const eventText = buffer.slice(0, eventEndIndex);
        buffer = buffer.slice(eventEndIndex + 2); // Remove processed event

        if (eventText.trim()) {
          const event = parseSSEEvent<T>(eventText);
          if (event) {
            yield event;
          }
        }
      }

      // Prevent buffer from growing too large (safety measure)
      if (buffer.length > MAX_BUFFER_SIZE) {
        console.warn(`SSE buffer exceeded ${MAX_BUFFER_SIZE} bytes. Trimming old data.`);
        buffer = buffer.slice(-BUFFER_TRIM_SIZE);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parse individual SSE event from text
 * Optimized for minimal string operations
 */
function parseSSEEvent<T = unknown>(eventText: string): SSEEvent<T> | null {
  let eventName = '';
  let eventData: T | null = null;

  const lines = eventText.split('\n');

  for (const line of lines) {
    if (line.startsWith('eventName:')) {
      eventName = line.slice(10).trim();
    } else if (line.startsWith('eventData:')) {
      const jsonText = line.slice(10).trim();
      try {
        eventData = JSON.parse(jsonText) as T;
      } catch (error) {
        console.error('Failed to parse SSE event data:', {
          error: error instanceof Error ? error.message : String(error),
          jsonText: jsonText.slice(0, 100), // Log first 100 chars
        });
        return null;
      }
    }
  }

  if (!eventName) {
    console.warn('SSE event missing eventName');
    return null;
  }

  if (eventData === null) {
    console.warn('SSE event missing eventData', { eventName });
    return null;
  }

  return { eventName, eventData };
}

/**
 * Enhanced fetch client for streaming with better error handling
 */
export async function streamClient(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    abortSignal?: AbortSignal;
  } = {}
): Promise<ReadableStream<Uint8Array>> {
  const aquaDomain = process.env.NEXT_PUBLIC_AQUA_DOMAIN;
  const aquaProjectId = process.env.NEXT_PUBLIC_AQUA_PROJECT_ID;

  if (!aquaDomain) {
    throw new StreamingError('NEXT_PUBLIC_AQUA_DOMAIN environment variable is not set');
  }

  if (!aquaProjectId) {
    throw new StreamingError('NEXT_PUBLIC_AQUA_PROJECT_ID environment variable is not set');
  }

  const bearerToken = getLocalStorageItem<string>(AQUA_SESSION_TOKEN);

  if (!bearerToken) {
    throw new StreamingError('Authentication token not found');
  }

  const fullUrl = `${aquaDomain}${url}`;

  try {
    const response = await fetch(fullUrl, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
        'X-Aqua-Project-Id': aquaProjectId,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.abortSignal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      // Try to get more detailed error message from response
      try {
        const errorBody = await response.text();
        if (errorBody) {
          errorMessage += ` - ${errorBody}`;
        }
      } catch {
        // Ignore if we can't read the error body
      }

      throw new StreamingError(errorMessage);
    }

    if (!response.body) {
      throw new StreamingError('Response body is not available for streaming');
    }

    return response.body;
  } catch (error) {
    if (error instanceof StreamingError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new StreamingError(
      `Failed to connect to ${fullUrl}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
