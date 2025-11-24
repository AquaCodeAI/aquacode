import React, { useCallback, useEffect, useState } from 'react';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import type { DeploymentInterface } from '@/interfaces/deployment-interfaces';
import type { ListResponseInterface } from '@/interfaces/response-interfaces';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';
import DeploymentItem from './project-version-items';
import { WorkspaceLoadingState, WorkspaceModalErrorState, WorkspaceModalEmptyState } from './workspace-modal-states';
import { WorkspaceModalBase } from './workspace-modal-base';

interface ProjectVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInterface;
  handleViewDeployment: (deployment: DeploymentInterface) => void;
}

// Pagination Configuration
const DEPLOYMENTS_PER_PAGE = 250;

// Error Messages
const ERROR_DEPLOYMENTS_LOAD_FAILED = 'Deployments could not be loaded. Please try again.';

// UI Messages
const MESSAGE_NO_VERSIONS_FOUND = 'No versions found';
const MESSAGE_DESCRIPTION = 'View all versions and deployments of your project.';

// Modal Configuration
const MODAL_TITLE = 'Project Versions';

export function ProjectVersionsModal({ isOpen, onClose, project, handleViewDeployment }: ProjectVersionsModalProps) {
  // Deployments State
  const [deployments, setDeployments] = useState<DeploymentInterface[]>([]);
  const [areDeploymentsLoading, setAreDeploymentsLoading] = useState(false);
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null);

  const loadDeployments = useCallback(
    async (page: number = 1) => {
      if (!project) return;

      try {
        setAreDeploymentsLoading(true);
        setDeploymentsError(null);

        const { data } = await fetchClient<ListResponseInterface<DeploymentInterface>>({
          url: '/v1/deployments',
          params: {
            page,
            perPage: DEPLOYMENTS_PER_PAGE,
            projectId: project._id,
          },
        });

        const fetchedDeployments = data.result;
        setDeployments((prev) => (page === 1 ? fetchedDeployments : [...prev, ...fetchedDeployments]));
      } catch (error) {
        if (error instanceof FetchClientError && error.response?.data?.errors) {
          setDeploymentsError(error.response.data.errors.join(', '));
        } else {
          setDeploymentsError(ERROR_DEPLOYMENTS_LOAD_FAILED);
        }
      } finally {
        setAreDeploymentsLoading(false);
      }
    },
    [project]
  );

  // Load deployments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDeployments(1).then();
    }
  }, [isOpen, loadDeployments]);

  const hasNoDeployments = deployments.length === 0;
  const isInitialLoading = areDeploymentsLoading && hasNoDeployments;

  const renderContent = () => {
    if (isInitialLoading) {
      return <WorkspaceLoadingState />;
    }

    if (deploymentsError) {
      return <WorkspaceModalErrorState message={deploymentsError} />;
    }

    if (hasNoDeployments) {
      return <WorkspaceModalEmptyState message={MESSAGE_NO_VERSIONS_FOUND} />;
    }

    return (
      <div className='rounded-xl border border-neutral-200 bg-white dark:border-white/20 dark:bg-neutral-800'>
        <div className='flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-white/20'>
          <p className='text-xs text-neutral-600 dark:text-neutral-300'>{MESSAGE_DESCRIPTION}</p>
        </div>

        {deployments.map((deployment, index) => (
          <DeploymentItem
            key={deployment._id}
            deployment={deployment}
            deployments={deployments}
            onClick={() => handleViewDeployment(deployment)}
            isFirst={index === 0}
          />
        ))}
      </div>
    );
  };

  return (
    <WorkspaceModalBase isOpen={isOpen} onClose={onClose} title={MODAL_TITLE}>
      {renderContent()}
    </WorkspaceModalBase>
  );
}
