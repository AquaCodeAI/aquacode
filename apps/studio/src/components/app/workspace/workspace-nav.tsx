'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpOnSquareIcon,
  CloudIcon,
  EyeIcon,
  ListBulletIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import WorkspaceNavButton from '@/components/app/workspace/workspace-nav-button';
import { ProjectContentModal } from '@/components/app/workspace-modals/project-content-modal';
import { ProjectSettingsModal } from '@/components/app/workspace-modals/project-settings-modal';
import { ProjectUsersModal } from '@/components/app/workspace-modals/project-users-modal';
import { ProjectVersionsModal } from '@/components/app/workspace-modals/project-versions-modal';
import { DeploymentType } from '@/interfaces/deployment-interfaces';
import type { DeploymentInterface } from '@/interfaces/deployment-interfaces';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import type { ItemResponseInterface, ListResponseInterface } from '@/interfaces/response-interfaces';
import { cn } from '@/utils/cn';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';

// UI Labels
const LABEL_EXIT = 'Exit';
const LABEL_SHOW_MENU_NAV = 'Show menu bar';
const LABEL_ROLLBACK = 'Rollback';
const LABEL_PROJECT_CONTENT = 'Project Content';
const LABEL_USERS = 'Users';
const LABEL_VERSIONS = 'Versions';
const LABEL_PROJECT_SETTINGS = 'Project Settings';
const LABEL_PUBLISH_APP = 'Publish App';

// Status Messages
const MESSAGE_ROLLING_BACK = 'Rolling back...';
const MESSAGE_VIEWING_VERSION = 'Viewing Version';

export interface WorkspaceNavProps {
  project?: ProjectInterface;
  selectedDeployment: DeploymentInterface | null;
  setSelectedDeployment: (deployment: DeploymentInterface | null) => void;
  onDataChange?: () => void;
}

export default function WorkspaceNav({
  project,
  selectedDeployment,
  setSelectedDeployment,
  onDataChange,
}: WorkspaceNavProps) {
  // Modal States
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isProjectContentModalOpen, setIsProjectContentModalOpen] = useState(false);
  const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);
  const [isProjectVersionsModalOpen, setIsProjectVersionsModalOpen] = useState(false);

  // Deployment States
  const [latestPreviewDeployment, setLatestPreviewDeployment] = useState<DeploymentInterface | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(true);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Fetch latest preview deployment
  const fetchLatestPreviewDeployment = useCallback(async () => {
    if (!project) return;

    try {
      setIsFetchingPreview(true);
      const { data } = await fetchClient<ListResponseInterface<DeploymentInterface>>({
        url: '/v1/deployments',
        params: {
          page: 1,
          perPage: 1,
          projectId: project._id,
          type: DeploymentType.PREVIEW,
        },
      });

      const previews = data.result;
      setLatestPreviewDeployment(previews.length > 0 ? previews[0] : null);
    } catch {
      setLatestPreviewDeployment(null);
    } finally {
      setIsFetchingPreview(false);
    }
  }, [project]);

  useEffect(() => {
    fetchLatestPreviewDeployment().then();
  }, [fetchLatestPreviewDeployment]);

  // Handlers
  const handleExitReadonly = () => {
    setSelectedDeployment(null);
    setRollbackError(null);
  };

  const handleRollback = async () => {
    if (!project || !selectedDeployment || isRollingBack) return;

    setIsRollingBack(true);
    setRollbackError(null);

    try {
      const targetDeploymentId = selectedDeployment.rolledBackTo || selectedDeployment._id;

      await fetchClient<ItemResponseInterface<DeploymentInterface>>({
        url: `/v1/deployments/${targetDeploymentId}/rollback`,
        method: 'POST',
      });

      setSelectedDeployment(null);
      onDataChange?.();
    } catch (error) {
      let errorMessage = 'Failed to rollback. Please try again.';

      if (error instanceof FetchClientError && error.response?.data) {
        const responseData = error.response.data as ItemResponseInterface<DeploymentInterface>;
        if (responseData.errors && responseData.errors.length > 0) {
          errorMessage = responseData.errors.join(', ');
        }
      }

      setRollbackError(errorMessage);
    } finally {
      setIsRollingBack(false);
    }
  };

  const handlePublishApp = async () => {
    if (!project || !latestPreviewDeployment || isPublishing) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      await fetchClient<ItemResponseInterface<DeploymentInterface>>({
        url: `/v1/deployments/${latestPreviewDeployment._id}/promote`,
        method: 'POST',
      });

      await fetchLatestPreviewDeployment();
      onDataChange?.();
    } catch (error) {
      let errorMessage = 'Failed to publish app. Please try again.';

      if (error instanceof FetchClientError && error.response?.data) {
        const responseData = error.response.data as ItemResponseInterface<DeploymentInterface>;
        if (responseData.errors && responseData.errors.length > 0) {
          errorMessage = responseData.errors.join(', ');
        }
      }

      setPublishError(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleViewDeployment = (deployment: DeploymentInterface) => {
    setSelectedDeployment(deployment);
    setIsProjectVersionsModalOpen(false);
  };

  const getVersionDisplayName = (deployment: DeploymentInterface) => {
    return deployment.type || deployment._id.slice(-8);
  };

  const canPublish = !isFetchingPreview && !!latestPreviewDeployment;

  return (
    <>
      <nav className='relative hidden w-full shrink-0 items-center py-1 md:flex md:py-2'>
        <div className='w-full'>
          {selectedDeployment ? (
            <div className='flex items-center justify-between'>
              <WorkspaceNavButton
                title={LABEL_EXIT}
                icon={<ArrowLeftIcon className='h-4 w-4' />}
                onClick={handleExitReadonly}
                disabled={isRollingBack}
                position='start'
              />

              <div className='text-center'>
                <div className={cn('text-sm', rollbackError && 'text-xs')}>
                  {isRollingBack
                    ? MESSAGE_ROLLING_BACK
                    : `${MESSAGE_VIEWING_VERSION}: ${getVersionDisplayName(selectedDeployment)}`}
                </div>
                {rollbackError && (
                  <div className='text-sm font-medium text-red-700 dark:text-red-300'>{rollbackError}</div>
                )}
              </div>

              <WorkspaceNavButton
                title={LABEL_ROLLBACK}
                icon={<ArrowRightIcon className='h-4 w-4' />}
                onClick={handleRollback}
                disabled={isRollingBack || !!rollbackError}
                isLoading={isRollingBack}
              />
            </div>
          ) : (
            <div className='flex items-center justify-between'>
              {publishError ? (
                <>
                  <WorkspaceNavButton
                    title={LABEL_SHOW_MENU_NAV}
                    icon={<EyeIcon className='h-4 w-4' />}
                    onClick={() => setPublishError(null)}
                    position='start'
                  />

                  <div className='text-center'>
                    <div className='text-sm font-medium text-red-700 dark:text-red-300'>{publishError}</div>
                  </div>

                  <WorkspaceNavButton
                    title={LABEL_PUBLISH_APP}
                    icon={<ArrowUpOnSquareIcon className='h-4 w-4' />}
                    onClick={handlePublishApp}
                    disabled={isPublishing || !!publishError}
                    isLoading={isPublishing}
                  />
                </>
              ) : (
                <>
                  <div className='flex items-center gap-1.5'>
                    <WorkspaceNavButton
                      title={LABEL_PROJECT_CONTENT}
                      icon={<CloudIcon className='h-4 w-4' />}
                      onClick={() => setIsProjectContentModalOpen(true)}
                      disabled={!project}
                    />
                    <WorkspaceNavButton
                      title={LABEL_USERS}
                      icon={<UsersIcon className='h-4 w-4' />}
                      onClick={() => setIsUserManagementModalOpen(true)}
                      disabled={!project}
                    />
                    <WorkspaceNavButton
                      title={LABEL_VERSIONS}
                      icon={<ListBulletIcon className='h-4 w-4' />}
                      onClick={() => setIsProjectVersionsModalOpen(true)}
                      disabled={!project}
                    />
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <WorkspaceNavButton
                      title={LABEL_PROJECT_SETTINGS}
                      icon={<Squares2X2Icon className='h-4 w-4' />}
                      onClick={() => setIsProjectSettingsModalOpen(true)}
                      disabled={!project}
                    />
                    <WorkspaceNavButton
                      title={LABEL_PUBLISH_APP}
                      icon={<ArrowUpOnSquareIcon className='h-4 w-4' />}
                      onClick={handlePublishApp}
                      disabled={!project || !canPublish || isPublishing}
                      isLoading={isPublishing}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      {isUserManagementModalOpen && project && (
        <ProjectUsersModal
          isOpen={isUserManagementModalOpen}
          onClose={() => setIsUserManagementModalOpen(false)}
          connection={project.connection}
        />
      )}

      {isProjectContentModalOpen && project && (
        <ProjectContentModal
          isOpen={isProjectContentModalOpen}
          onClose={() => setIsProjectContentModalOpen(false)}
          connection={project.connection}
        />
      )}

      {isProjectSettingsModalOpen && project && (
        <ProjectSettingsModal
          isOpen={isProjectSettingsModalOpen}
          onClose={() => setIsProjectSettingsModalOpen(false)}
          project={project}
        />
      )}

      {isProjectVersionsModalOpen && project && (
        <ProjectVersionsModal
          isOpen={isProjectVersionsModalOpen}
          onClose={() => setIsProjectVersionsModalOpen(false)}
          project={project}
          handleViewDeployment={handleViewDeployment}
        />
      )}
    </>
  );
}
