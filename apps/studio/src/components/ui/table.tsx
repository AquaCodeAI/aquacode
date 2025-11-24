'use client';

import { extendVariants } from '@heroui/system';
import { Table as NUTable } from '@heroui/table';

export const Table = extendVariants(NUTable, {
  variants: {
    color: {
      default: {
        wrapper: 'bg-transparent p-0 rounded-medium border-default border',
        th: 'first:rounded-s-none last:rounded-e-none bg-background-600 text-foreground-700',
        tr: 'border-b border-default',
      },
    },
  },

  defaultVariants: {
    color: 'default',
  },
});

export { TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/table';
