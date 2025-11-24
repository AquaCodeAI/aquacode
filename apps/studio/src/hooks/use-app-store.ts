import { use } from 'react';
import { useStore } from 'zustand';
import { AppStoreContext } from '@/contexts/app-context';
import { AppState } from '@/stores/app-store';

export const useAppStore = <T>(selector: (store: AppState) => T): T => {
  const context = use(AppStoreContext);

  if (!context) {
    throw new Error('hook must be used within a provider');
  }

  return useStore(context, selector);
};
