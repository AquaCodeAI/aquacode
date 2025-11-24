import { use } from 'react';
import { useStore } from 'zustand';
import { PostEditorStoreContext } from '@/contexts/post-editor-store-context';
import { PostEditorState } from '@/stores/post-editor-store';

export const usePostEditorStore = <T>(selector: (state: PostEditorState) => T): T => {
  const context = use(PostEditorStoreContext);

  if (!context) {
    throw new Error('usePostEditorStore must be used within PostEditorStoreProvider');
  }

  return useStore(context, selector);
};
