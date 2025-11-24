'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/hooks/use-app-store';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import type { ListResponseInterface } from '@/interfaces/response-interfaces';
import type { MessageInterface } from '@/interfaces/message-interfaces';
import { type SandboxInterface, SandboxStatus } from '@/interfaces/sandboxes-interfaces';
import { type DeploymentInterface, DeploymentStatus } from '@/interfaces/deployment-interfaces';
import { fetchClient } from '@/utils/fetch-client';
import {
  ContentLoadingState,
  ContentQueueState,
  ContentErrorState,
  ContentPreviewIframe,
} from './workspace-content-states';

export interface WorkspaceContentProps {
  project?: ProjectInterface;
  messages: MessageInterface[];
  setCurrentIframePath?: (path: string) => void;
  selectedDeployment?: DeploymentInterface | null;
  onActiveDeploymentChange?: (deployment: DeploymentInterface | null) => void;
  refreshTrigger?: number;
}

// Pagination Configuration
const SANDBOXES_PER_PAGE = 1;
const DEPLOYMENTS_PER_PAGE = 1;

// Event Names
const SANDBOX_EVENT_INITIALIZING = 'sandbox.initializing';
const SANDBOX_EVENT_INITIALIZED = 'sandbox.initialized';
const SANDBOX_EVENT_FAILED = 'sandbox.failed';
const SANDBOX_EVENT_CLOSED = 'sandbox.closed';
const DEPLOYMENT_EVENT_READY = 'deployment.ready';
const DEPLOYMENT_EVENT_FAILED = 'deployment.failed';

// PostMessage Types
const MESSAGE_TYPE_ROUTE_CHANGE = 'routeChange';

// Protocol Configuration
const PROTOCOL_HTTPS = 'https://';
const PROTOCOL_REGEX = /^https?:\/\//;

export default function WorkspaceContent({
  project,
  messages,
  setCurrentIframePath,
  selectedDeployment,
  onActiveDeploymentChange,
  refreshTrigger = 0,
}: WorkspaceContentProps) {
  // Store State
  const events = useAppStore((s) => s.events);

  // Sandbox State
  const [activeSandbox, setActiveSandbox] = useState<SandboxInterface | null>(null);
  const [queuedSandbox, setQueuedSandbox] = useState<SandboxInterface | null>(null);
  const [areSandboxesLoading, setAreSandboxesLoading] = useState(true);

  // Deployment State
  const [activeDeployment, setActiveDeployment] = useState<DeploymentInterface | null>(null);
  const [areDeploymentsLoading, setAreDeploymentsLoading] = useState(true);

  const loadDeployments = useCallback(
    async (page: number = 1) => {
      if (!project) return;

      try {
        const { data } = await fetchClient<ListResponseInterface<DeploymentInterface>>({
          url: '/v1/deployments',
          params: {
            page,
            perPage: DEPLOYMENTS_PER_PAGE,
            projectId: project._id,
          },
        });

        const fetchedDeployments = data.result.reverse();
        const readyDeployment = fetchedDeployments.find((deployment) => deployment.status === DeploymentStatus.READY);

        setActiveDeployment(readyDeployment || null);
        onActiveDeploymentChange?.(readyDeployment || null);
      } finally {
        setAreDeploymentsLoading(false);
      }
    },
    [project, onActiveDeploymentChange]
  );

  const loadSandboxes = useCallback(
    async (page: number = 1) => {
      if (!project) return;

      try {
        const { data } = await fetchClient<ListResponseInterface<SandboxInterface>>({
          url: '/v1/sandboxes',
          params: {
            page,
            perPage: SANDBOXES_PER_PAGE,
            projectId: project._id,
          },
        });

        const fetchedSandboxes = data.result.reverse();
        const initializedSandbox = fetchedSandboxes.find((sandbox) => sandbox.status === SandboxStatus.INITIALIZED);
        const initializingSandbox = fetchedSandboxes.find((sandbox) => sandbox.status === SandboxStatus.INITIALIZING);

        setActiveSandbox(initializedSandbox || null);
        setQueuedSandbox(initializingSandbox || null);
      } finally {
        setAreSandboxesLoading(false);
      }
    },
    [project]
  );

  // Load initial data when project is available
  useEffect(() => {
    if (project) {
      loadDeployments(1).then();
      loadSandboxes(1).then();
    }
  }, [project, loadDeployments, loadSandboxes]);

  // Refresh data when refresh trigger changes
  useEffect(() => {
    if (project && refreshTrigger > 0) {
      setAreDeploymentsLoading(true);
      setAreSandboxesLoading(true);
      loadDeployments(1).then();
      loadSandboxes(1).then();
    }
  }, [refreshTrigger, project, loadDeployments, loadSandboxes]);

  // Handle real-time events
  useEffect(() => {
    if (!project || !events.length) return;

    const lastEvent = events[events.length - 1];
    if (!lastEvent?.eventName || !lastEvent?.eventData) return;

    const sandboxEventNames = [
      SANDBOX_EVENT_INITIALIZING,
      SANDBOX_EVENT_INITIALIZED,
      SANDBOX_EVENT_FAILED,
      SANDBOX_EVENT_CLOSED,
    ];

    const deploymentEventNames = [DEPLOYMENT_EVENT_READY, DEPLOYMENT_EVENT_FAILED];

    const isSandboxEvent = sandboxEventNames.includes(lastEvent.eventName);
    const isDeploymentEvent = deploymentEventNames.includes(lastEvent.eventName);

    if (isSandboxEvent) {
      loadSandboxes(1).then();
    } else if (isDeploymentEvent) {
      loadDeployments(1).then();
    }
  }, [project, events, loadSandboxes, loadDeployments]);

  // Listen for route changes from iframe
  useEffect(() => {
    const previewDomain = selectedDeployment?.domain || activeSandbox?.domain || activeDeployment?.domain;
    if (!previewDomain || !setCurrentIframePath) return;

    const normalizedDomain = previewDomain.replace(PROTOCOL_REGEX, '');
    const previewOrigin = `${PROTOCOL_HTTPS}${normalizedDomain}`;

    const handleRouteChangeMessage = (event: MessageEvent) => {
      const isValidOrigin = event.origin === previewOrigin;
      const isRouteChangeMessage = event.data?.type === MESSAGE_TYPE_ROUTE_CHANGE;
      const hasFullPath = !!event.data?.fullPath;

      if (isValidOrigin && isRouteChangeMessage && hasFullPath) {
        setCurrentIframePath(event.data.fullPath);
      }
    };

    window.addEventListener('message', handleRouteChangeMessage);
    return () => window.removeEventListener('message', handleRouteChangeMessage);
  }, [selectedDeployment, activeSandbox, activeDeployment, setCurrentIframePath]);

  // Determine what content to display
  const hasNoMessages = messages.length === 0;
  const isContentLoading = !project || areSandboxesLoading || areDeploymentsLoading || hasNoMessages;

  const previewDomain = selectedDeployment?.domain || activeSandbox?.domain || activeDeployment?.domain;
  const previewUrl = previewDomain ? `${PROTOCOL_HTTPS}${previewDomain.replace(PROTOCOL_REGEX, '')}` : null;

  const hasSandboxInQueue = !!queuedSandbox;

  let contentToRender;
  if (isContentLoading) {
    contentToRender = <ContentLoadingState />;
  } else if (hasSandboxInQueue) {
    contentToRender = <ContentQueueState />;
  } else if (previewUrl) {
    contentToRender = <ContentPreviewIframe src={previewUrl} />;
  } else {
    contentToRender = <ContentErrorState />;
  }

  return (
    <div className='flex flex-grow flex-col overflow-hidden rounded-none md:rounded-xl md:border dark:border-white/20 dark:bg-neutral-800'>
      <div className='relative flex flex-grow flex-col items-center'>
        <div className='absolute inset-0 z-10'>
          <div className='relative flex h-full w-full flex-1'>{contentToRender}</div>
        </div>
      </div>
    </div>
  );
}
