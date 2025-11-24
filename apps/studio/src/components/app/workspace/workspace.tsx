'use client';

import { useState } from 'react';
import type { DeploymentInterface } from '@/interfaces/deployment-interfaces';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import type { MessageInterface } from '@/interfaces/message-interfaces';
import WorkspaceNav from './workspace-nav';
import WorkspaceContent from './workspace-content';

export interface WorkAreaProps {
  project?: ProjectInterface;
  messages: MessageInterface[];
  setCurrentIframePath?: (v: string) => void;
  selectedDeployment: DeploymentInterface | null;
  setSelectedDeployment: (v: DeploymentInterface | null) => void;
}

export default function Workspace({
  project,
  messages,
  setCurrentIframePath,
  selectedDeployment,
  setSelectedDeployment,
}: WorkAreaProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataChange = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <WorkspaceNav
        project={project}
        selectedDeployment={selectedDeployment}
        setSelectedDeployment={setSelectedDeployment}
        onDataChange={handleDataChange}
      />
      <WorkspaceContent
        project={project}
        messages={messages}
        setCurrentIframePath={setCurrentIframePath}
        selectedDeployment={selectedDeployment}
        refreshTrigger={refreshTrigger}
      />
    </>
  );
}
