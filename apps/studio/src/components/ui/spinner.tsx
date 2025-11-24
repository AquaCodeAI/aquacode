'use client';

import { cn } from '@/utils/cn';
import { Spinner as HUSpinner, SpinnerProps } from '@heroui/spinner';

export const Spinner = ({ className, ...props }: SpinnerProps) => {
  return <HUSpinner aria-label='loader' className={cn('flex', className)} {...props} />;
};
