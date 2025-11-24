import { StateCreator } from 'zustand';
import { persist, subscribeWithSelector, createJSONStorage } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { AQUA_POST_EDITOR_STORE } from '@/constants/aqua-constants';
import { PostEditorSlice, createPostEditorSlice } from './slices/post-editor-slice';

export type PostEditorState = PostEditorSlice;

type CreateStoreApi = StateCreator<PostEditorState>;

const createStoreApi: CreateStoreApi = (...a) => {
  return {
    ...createPostEditorSlice(...a),
  };
};

export const createPostEditorStore = () => {
  return createStore<PostEditorState>()(
    subscribeWithSelector(
      persist(createStoreApi, {
        name: AQUA_POST_EDITOR_STORE,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          message: state.message,
          modelId: state.modelId,
          wasCleared: state.wasCleared,
        }),
      })
    )
  );
};
