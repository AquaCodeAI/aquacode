'use client';

import React, { KeyboardEvent } from 'react';
import { ArrowUpIcon, StopIcon } from '@heroicons/react/24/outline';
import { Button, Select, SelectItem, Textarea } from '@/components/ui';

export interface ContinueChatInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  onSubmitPrompt: () => void;
  isOnStreaming: boolean;
  isViewingDeployment: boolean;
  onCancelGeneration: (userMessageId: string) => void;
  errorMessage: string | null;
}

export default function ChatInputTextArea({
  prompt,
  onPromptChange,
  selectedModel,
  setSelectedModel,
  onSubmitPrompt,
  isOnStreaming,
  isViewingDeployment,
  onCancelGeneration,
  errorMessage,
}: ContinueChatInputProps) {
  const cleanedPrompt = prompt.trim();
  const handleKeyDown = (e: KeyboardEvent) => {
    const isEnter = e.key === 'Enter';
    const isPlainEnter = isEnter && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey;

    if (isPlainEnter) {
      e.preventDefault();
      if (!isOnStreaming && !isViewingDeployment && cleanedPrompt.length > 0) {
        onSubmitPrompt();
      }
    }
  };

  const models: { key: string; label: string }[] = [
    { key: 'claude-sonnet-4.5', label: 'Claude 4.5 Sonnet' },
    { key: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  ];

  return (
    <>
      <div className='relative flex flex-1 items-center'>
        <Textarea
          aria-label='Prompt input'
          placeholder='Build anything'
          variant='bordered'
          size='md'
          radius='none'
          minRows={2}
          maxRows={10}
          value={prompt}
          errorMessage={errorMessage}
          isInvalid={!!errorMessage}
          onValueChange={onPromptChange}
          onKeyDown={handleKeyDown}
          autoFocus={!isOnStreaming}
          disabled={isOnStreaming}
          classNames={{
            inputWrapper: 'bg-white dark:bg-neutral-800 border-0 px-0 shadow-none',
            input: 'text-sm text-base leading-relaxed ',
          }}
        />
      </div>
      <div className='absolute right-2 bottom-2 flex items-center'>
        <Select
          size='md'
          selectedKeys={[selectedModel]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setSelectedModel(selected);
          }}
          aria-label='Select AI model'
          className='w-44'
          disallowEmptySelection
          classNames={{
            trigger: 'min-h-8 h-8 bg-white dark:bg-neutral-800 border-0 shadow-none cursor-pointer',
            value: 'text-sm text-right',
          }}
        >
          {models.map((model) => (
            <SelectItem key={model.key}>{model.label}</SelectItem>
          ))}
        </Select>

        {!isOnStreaming ? (
          <Button
            type='button'
            size='xs'
            radius='full'
            aria-label='Send'
            className='bg-black hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:hover:bg-white/90'
            onClick={onSubmitPrompt}
            disabled={cleanedPrompt.length === 0 || isOnStreaming || isViewingDeployment}
          >
            <ArrowUpIcon className='h-4 w-4 stroke-3 text-white dark:text-black' />
          </Button>
        ) : (
          <Button
            type='button'
            size='xs'
            radius='full'
            aria-label='Send'
            className='bg-black hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:hover:bg-white/90'
            onClick={onCancelGeneration}
          >
            <StopIcon className='h-4 w-4 stroke-3 text-white dark:text-black' />
          </Button>
        )}
      </div>
    </>
  );
}
