import { StateCreator } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { AQUA_APP_STORE } from '@/constants/aqua-constants';
import { AppSlice, createAppSlice } from './slices/app-slice';
import { AppSocketSlice, createAppSocketSlice } from './slices/app-socket-slice';

export type AppState = AppSlice & AppSocketSlice;

type CreateStoreApi = (initial: Partial<AppState>) => StateCreator<AppState>;

const createStoreApi: CreateStoreApi =
  (appSlice) =>
  (...a) => {
    const { isDark, user, session, isProfileLoading } = appSlice;
    return {
      ...createAppSlice({ isDark, user, session, isProfileLoading })(...a),
      ...createAppSocketSlice(...a),
    };
  };

export const createAppStore = (initState: Partial<AppState> = {}) => {
  return createStore<AppState>()(
    subscribeWithSelector(
      persist(createStoreApi(initState), {
        name: AQUA_APP_STORE,
        partialize: (state) => {
          const { socket, ...rest } = state;
          return rest;
        },
      })
    )
  );
};
