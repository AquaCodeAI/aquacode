'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from '@/components/ui';
import Chat from '@/components/app/chat/chat';
import Workspace from '@/components/app/workspace/workspace';
import { authPages } from '@/configurations/pages';
import { useAppStore } from '@/hooks/use-app-store';
import { DeploymentInterface } from '@/interfaces/deployment-interfaces';
import type { MessageInterface } from '@/interfaces/message-interfaces';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import type { ItemResponseInterface, ListResponseInterface } from '@/interfaces/response-interfaces';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';

// Panel Layout Configuration
const CHAT_PANEL_DEFAULT_SIZE = 26;
const CHAT_PANEL_MIN_SIZE = 20;
const CHAT_PANEL_MAX_SIZE = 35;

const WORKSPACE_PANEL_DEFAULT_SIZE = 74;
const WORKSPACE_PANEL_MIN_SIZE = 65;

// Error Messages
const ERROR_PROJECT_LOAD_FAILED = 'Project could not be loaded. Please try again.';
const ERROR_UNEXPECTED = 'An unexpected error has occurred.';

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const projectId = (params?.id as string) || '';

  // Auth State
  const isProfileLoading = useAppStore((s) => s.isProfileLoading);
  const session = useAppStore((s) => s.session);
  const user = useAppStore((s) => s.user);

  // Project State
  const [project, setProject] = useState<ProjectInterface>();
  const [projectError, setProjectError] = useState<string | null>(null);

  // Hydration State
  const [isPanelMounted, setIsPanelMounted] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [areMessagesLoading, setAreMessagesLoading] = useState(true);

  // Workspace State
  const [workspaceIframeCurrentRoute, setWorkspaceIframeCurrentRoute] = useState('/');
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentInterface | null>(null);

  useEffect(() => {
    setIsPanelMounted(true);
  }, []);

  const loadProject = useCallback(async () => {
    try {
      setProjectError(null);

      const { data } = await fetchClient<ItemResponseInterface<ProjectInterface>>({
        url: `/v1/projects/${projectId}`,
      });

      const fetchedProject = data.result;
      setProject(fetchedProject);
    } catch (error) {
      if (error instanceof FetchClientError && error.response?.data) {
        const responseData = error.response.data as ListResponseInterface<ProjectInterface>;
        if (responseData.errors && responseData.errors.length > 0) {
          setProjectError(responseData.errors.join(', '));
        } else {
          setProjectError(ERROR_PROJECT_LOAD_FAILED);
        }
      } else {
        setProjectError(ERROR_UNEXPECTED);
      }
    }
  }, [projectId]);

  // Load project when user is authenticated
  useEffect(() => {
    if (session && user) {
      loadProject().then();
    }
  }, [session, user, loadProject]);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isProfileLoading && !session && !user) {
      router.push(authPages.signIn.to);
    }
  }, [isProfileLoading, session, user, router]);

  return (
    <div className='flex h-dvh flex-col'>
      <div className='flex min-h-0 flex-1 flex-col'>
        <main className='relative isolate flex min-h-0 flex-1'>
          <div className='flex min-h-0 flex-1'>
            {!isPanelMounted ? null : projectError ? (
              <div className='flex h-full min-h-0 w-full flex-1 items-center justify-center'>{projectError}</div>
            ) : (
              <PanelGroup direction='horizontal' className='relative flex h-full min-h-0 w-full flex-1'>
                <Panel
                  id='chat'
                  collapsible
                  defaultSize={CHAT_PANEL_DEFAULT_SIZE}
                  minSize={CHAT_PANEL_MIN_SIZE}
                  maxSize={CHAT_PANEL_MAX_SIZE}
                  className='relative inset-y-0 z-40 mr-0 flex h-full min-h-0 overflow-x-hidden'
                  style={{ overflow: 'hidden' }}
                >
                  <Chat
                    project={project}
                    messages={messages}
                    setMessages={setMessages}
                    isMessagesLoading={areMessagesLoading}
                    setIsMessagesLoading={setAreMessagesLoading}
                    currentIframePath={workspaceIframeCurrentRoute}
                    selectedDeployment={selectedDeployment}
                  />
                </Panel>
                <PanelResizeHandle
                  id='haddle'
                  className='relative mx-2 my-3 ml-2 w-0.5 cursor-col-resize rounded-full transition-colors hover:bg-neutral-300 dark:hover:bg-neutral-600'
                >
                  <div className='absolute -inset-x-1 inset-y-0' />
                </PanelResizeHandle>
                <Panel
                  id='workspace'
                  defaultSize={WORKSPACE_PANEL_DEFAULT_SIZE}
                  minSize={WORKSPACE_PANEL_MIN_SIZE}
                  className='relative flex flex-1 flex-col pr-2 pb-2'
                  style={{ overflow: 'hidden' }}
                >
                  <Workspace
                    project={project}
                    messages={messages}
                    setCurrentIframePath={setWorkspaceIframeCurrentRoute}
                    selectedDeployment={selectedDeployment}
                    setSelectedDeployment={setSelectedDeployment}
                  />
                </Panel>
              </PanelGroup>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
