'use client';

import { Select as NUSelect } from '@heroui/select';
import { extendVariants } from '@heroui/system';

export const Select = extendVariants(NUSelect, {
  variants: {
    color: {
      default: {
        innerWrapper: 'bg-transparent',
        trigger: 'bg-background-500 border-default',
      },
    },
  },
  defaultVariants: {
    color: 'default',
    labelPlacement: 'outside',
    variant: 'bordered',
    size: 'lg',
    placeholder: ' ',
    radius: 'md',
  },
});

export { SelectItem } from '@heroui/select';
