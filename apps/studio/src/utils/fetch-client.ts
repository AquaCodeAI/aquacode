import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AQUA_SESSION_TOKEN } from '@/constants/aqua-constants';
import { getLocalStorageItem } from '@/utils/local-storage';

/**
 * Client-side fetch utility that automatically includes active session cookies
 * Maintains better-fetch structure while adding session management
 */
export async function fetchClient<T = unknown, R = AxiosResponse<T>, D = unknown>(
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

    config.headers = {
      'X-Aqua-Project-Id': aquaProjectId,
      ...options?.headers,
    };

    const bearerToken = getLocalStorageItem<string>(AQUA_SESSION_TOKEN);
    if (bearerToken) {
      config.headers.Authorization = `Bearer ${bearerToken}`;
    }
  }

  return await axios(config);
}

export { AxiosError as FetchClientError };
