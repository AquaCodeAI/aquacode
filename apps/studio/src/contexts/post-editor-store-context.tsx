'use client';

import { type ReactNode, createContext, useRef } from 'react';
import { createPostEditorStore } from '@/stores/post-editor-store';

export type PostEditorStoreApi = ReturnType<typeof createPostEditorStore>;

export const PostEditorStoreContext = createContext<PostEditorStoreApi | undefined>(undefined);

export interface PostEditorStoreProviderProps {
  children: ReactNode;
}

export const PostEditorStoreProvider = ({ children }: PostEditorStoreProviderProps) => {
  const storeRef = useRef<PostEditorStoreApi>(createPostEditorStore());

  if (!storeRef.current) {
    storeRef.current = createPostEditorStore();
  }

  return <PostEditorStoreContext value={storeRef.current}>{children}</PostEditorStoreContext>;
};
