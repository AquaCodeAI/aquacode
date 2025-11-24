'use client';

import { Button as NUButton } from '@heroui/button';
import { extendVariants } from '@heroui/system';

export const Button = extendVariants(NUButton, {
  variants: {
    variant: {
      link: 'text-secondary underline',
    },
    size: {
      auto: 'h-auto min-h-min w-auto min-w-min',
      xs: 'h-9 min-w-9 min-h-9 text-tiny',
      sm: 'h-10 min-w-10 min-h-10',
      md: 'h-11 min-w-11 min-h-11',
      lg: 'h-12 min-w-12 min-h-12',
      xl: 'h-14 min-w-14 min-h-14',
    },
  },

  defaultVariants: {
    color: 'primary',
    radius: 'md',
    size: 'md',
  },

  compoundVariants: [
    {
      class: 'font-semibold pr-2 pl-2',
    },
    {
      size: 'auto',
      variant: 'link',
      class: 'rounded-none',
    },
    {
      variant: 'flat',
      color: 'primary',
      class: 'bg-primary/5 text-primary',
    },
  ],
});
