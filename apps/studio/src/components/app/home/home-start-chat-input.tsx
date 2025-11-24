import { ArrowUpIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { Button, Select, SelectItem, Textarea } from '@/components/ui';
import { cn } from '@/utils/cn';

interface HomeStartChatInputProps {
  message: string;
  setMessage: (value: string) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  handleMessageSubmit: () => void;
  isSendDisabled: boolean;
  errorMessage: string | null;
}

// UI Configuration
const TEXTAREA_MIN_ROWS = 2;
const TEXTAREA_MAX_ROWS = 10;

// UI Labels
const LABEL_PROMPT_INPUT = 'Prompt input';
const LABEL_SEND = 'Send';
const PLACEHOLDER_TEXT = 'What do you want to create?';

export function HomeStartChatInput({
  message,
  setMessage,
  selectedModel,
  setSelectedModel,
  handleMessageSubmit,
  isSendDisabled,
  errorMessage,
}: HomeStartChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isEnter = e.key === 'Enter';
    const isPlainEnter = isEnter && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey;

    if (isPlainEnter) {
      e.preventDefault();
      if (!isSendDisabled) {
        handleMessageSubmit();
      }
    }
  };

  const models: { key: string; label: string }[] = [
    { key: 'claude-sonnet-4.5', label: 'Claude 4.5 Sonnet' },
    { key: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  ];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'w-full cursor-text overflow-clip rounded-3xl',
        'border border-black/15 bg-white shadow-sm dark:border-white/20 dark:bg-neutral-800'
      )}
    >
      <div className='relative flex min-h-12 w-full items-end'>
        <div className='relative flex w-full flex-auto flex-col'>
          <div className='relative mx-4 flex min-h-12 flex-auto items-start'>
            <Textarea
              id='home-start-chat'
              aria-label={LABEL_PROMPT_INPUT}
              placeholder={PLACEHOLDER_TEXT}
              variant='bordered'
              size='md'
              radius='none'
              minRows={TEXTAREA_MIN_ROWS}
              maxRows={TEXTAREA_MAX_ROWS}
              value={message}
              errorMessage={errorMessage}
              isInvalid={!!errorMessage}
              onValueChange={setMessage}
              onKeyDown={handleKeyDown}
              classNames={{
                inputWrapper: 'bg-white dark:bg-neutral-800 border-0 px-0 shadow-none',
                input: 'text-sm text-base leading-relaxed py-3',
              }}
            />
          </div>
          <div className='h-12' />
        </div>
        <div className='absolute right-2 bottom-2 flex items-center gap-2'>
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
          <Button
            type='button'
            size='sm'
            radius='full'
            aria-label={LABEL_SEND}
            className='bg-black hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:hover:bg-white/90'
            onClick={handleMessageSubmit}
            disabled={isSendDisabled}
          >
            <ArrowUpIcon className='h-5 w-5 stroke-3 text-white dark:text-black' />
          </Button>
        </div>
      </div>
    </div>
  );
}
