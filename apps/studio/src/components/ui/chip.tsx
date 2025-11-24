'use client';

import { Chip as HUChip } from '@heroui/chip';
import { extendVariants } from '@heroui/system';

export const Chip = extendVariants(HUChip, {
  variants: {
    color: {
      blue: {},
    },
    variant: {
      flat: {},
    },
  },

  compoundVariants: [
    {
      variant: 'solid',
      color: 'blue',
      class: 'bg-primary-400 text-primary-foreground',
    },
    {
      variant: 'solid',
      color: 'default',
      class: 'bg-default-200 dark:bg-background-400',
    },
    {
      variant: 'flat',
      color: 'blue',
      class: 'bg-primary-400/10 text-[#1F4DE3]  dark:text-primary-foreground',
    },
  ],

  defaultVariants: {
    color: 'default',
    variant: 'solid',
  },
});
