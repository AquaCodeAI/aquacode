'use client';

import React, { Dispatch, SetStateAction } from 'react';
import { DeploymentInterface } from '@/interfaces/deployment-interfaces';
import type { MessageInterface } from '@/interfaces/message-interfaces';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import ChatContent from './chat-content';
import ChatInput from './chat-input';
import ChatNav from './chat-nav';

export interface ChatContainerProps {
  project?: ProjectInterface;
  messages: MessageInterface[];
  setMessages: Dispatch<SetStateAction<MessageInterface[]>>;
  isMessagesLoading: boolean;
  setIsMessagesLoading?: (v: boolean) => void;
  currentIframePath?: string;
  selectedDeployment: DeploymentInterface | null;
}

export default function Chat({
  project,
  messages,
  setMessages,
  isMessagesLoading,
  setIsMessagesLoading,
  currentIframePath,
  selectedDeployment,
}: ChatContainerProps) {
  return (
    <div className='flex min-h-0 w-full flex-1 flex-col pl-2'>
      <ChatNav project={project} />
      <ChatContent
        project={project}
        messages={messages}
        setMessages={setMessages}
        isMessagesLoading={isMessagesLoading}
        setIsMessagesLoading={setIsMessagesLoading}
      />
      <ChatInput
        project={project}
        messages={messages}
        setMessages={setMessages}
        isMessagesLoading={isMessagesLoading}
        currentIframePath={currentIframePath}
        selectedDeployment={selectedDeployment}
      />
    </div>
  );
}
