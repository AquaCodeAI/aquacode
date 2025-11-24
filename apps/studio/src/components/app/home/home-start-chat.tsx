'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { appPaths, authPages } from '@/configurations/pages';
import { useAppStore } from '@/hooks/use-app-store';
import { usePostEditorStore } from '@/hooks/use-post-editor-store';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import type { ItemResponseInterface } from '@/interfaces/response-interfaces';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';
import { HomeStartChatInput } from './home-start-chat-input';

// Error Messages
const ERROR_PROJECT_CREATE_FAILED = 'Projects could not be loaded. Please try again.';
const ERROR_UNEXPECTED = 'An unexpected error has occurred.';

export default function HomeStartChat() {
  const router = useRouter();

  // Auth State
  const session = useAppStore((s) => s.session);
  const user = useAppStore((s) => s.user);
  const isUserAuthenticated = !!session && !!user;

  // Editor State
  const userMessage = usePostEditorStore((s) => s.message);
  const setUserMessage = usePostEditorStore((s) => s.setMessage);
  const selectedModelId = usePostEditorStore((s) => s.modelId);
  const setSelectedModelId = usePostEditorStore((s) => s.setModelId);
  const wasMessageCleared = usePostEditorStore((s) => s.wasCleared);

  // Project Creation State
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectCreationError, setProjectCreationError] = useState<string | null>(null);

  const createProject = useCallback(
    async (projectDescription: string, modelId: string) => {
      if (!isUserAuthenticated) {
        router.push(authPages.signIn.to);
        return;
      }

      try {
        setIsCreatingProject(true);
        setProjectCreationError(null);

        const { data } = await fetchClient<ItemResponseInterface<ProjectInterface>>({
          url: `/v1/projects`,
          method: 'POST',
          data: { description: projectDescription, aiModelId: modelId },
        });

        const newProject = data.result;

        router.push(appPaths.projects.details.to(newProject._id));
      } catch (error) {
        if (error instanceof FetchClientError && error.response?.data) {
          const responseData = error.response.data as ItemResponseInterface<ProjectInterface>;
          if (responseData.errors && responseData.errors.length > 0) {
            setProjectCreationError(responseData.errors.join(', '));
          } else {
            setProjectCreationError(ERROR_PROJECT_CREATE_FAILED);
          }
        } else {
          setProjectCreationError(ERROR_UNEXPECTED);
        }
      } finally {
        setIsCreatingProject(false);
      }
    },
    [router, isUserAuthenticated]
  );

  const handleMessageSubmit = useCallback(() => {
    const trimmedMessage = userMessage?.trim();

    if (trimmedMessage) {
      createProject(trimmedMessage, selectedModelId).then();
    }
  }, [userMessage, createProject]);

  const hasEmptyMessage = !userMessage || userMessage.trim() === '';
  const isSendDisabled = isCreatingProject || hasEmptyMessage || wasMessageCleared;

  return (
    <div className='mt-6 w-full max-w-3xl px-3 md:px-5'>
      <div className='relative w-full'>
        <HomeStartChatInput
          message={userMessage}
          setMessage={setUserMessage}
          selectedModel={selectedModelId}
          setSelectedModel={setSelectedModelId}
          handleMessageSubmit={handleMessageSubmit}
          isSendDisabled={isSendDisabled}
          errorMessage={projectCreationError}
        />
      </div>
    </div>
  );
}
