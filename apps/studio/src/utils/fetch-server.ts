import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { headers } from 'next/headers';

/**
 * Server-side fetch utility that automatically includes active session cookies
 * Maintains better-fetch structure while adding session management
 */
export async function fetchServer<T = unknown, R = AxiosResponse<T>, D = unknown>(
  options?: AxiosRequestConfig<D>
): Promise<R> {
  const aquaDomain = process.env.NEXT_PUBLIC_AQUA_DOMAIN!;
  const aquaProjectId = process.env.NEXT_PUBLIC_AQUA_PROJECT_ID!;

  const config: AxiosRequestConfig = {
    ...options,
  };

  // If url exists, verify if it starts with aquaDomain
  const isAquaRequest = options?.baseURL ? options.baseURL.startsWith(aquaDomain) : true;

  if (isAquaRequest) {
    config.baseURL = aquaDomain;

    // Extract User-Agent from incoming request headers
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'Aqua-Server/1.0';

    config.headers = {
      'X-Aqua-Project-Id': aquaProjectId,
      'User-Agent': userAgent,
      ...options?.headers,
    };
  }

  return await axios(config);
}

export { AxiosError as FetchServerError };
