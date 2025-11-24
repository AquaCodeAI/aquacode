import type { ReactNode } from 'react';

interface ServerProvidersProps {
  children: ReactNode;
}

export const ServerProviders = ({ children }: ServerProvidersProps) => {
  return children;
};
