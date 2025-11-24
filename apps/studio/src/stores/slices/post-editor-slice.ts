import { StateCreator } from 'zustand/vanilla';
import { PostEditorState } from '@/stores/post-editor-store';

interface State {
  message: string;
  modelId: string;
  wasCleared: boolean;
}

type Actions = {
  setMessage: (message: string) => void;
  setModelId: (modelId: string) => void;
  clearMessage: () => void;
};

export type PostEditorSlice = State & Actions;

type PostEditorSliceCreator = StateCreator<PostEditorState, [], [], PostEditorSlice>;

const initialState: State = {
  message: '',
  modelId: 'claude-sonnet-4.5',
  wasCleared: false,
};

export const createPostEditorSlice: PostEditorSliceCreator = (set) => {
  return {
    ...initialState,
    setMessage: (message) => set({ message, wasCleared: false }),
    setModelId: (modelId) => set({ modelId }),
    clearMessage: () => set({ message: '', wasCleared: true }),
  };
};
