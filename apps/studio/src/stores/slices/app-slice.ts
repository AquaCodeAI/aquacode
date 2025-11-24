import { StateCreator } from 'zustand/vanilla';
import { SessionInterface } from '@/interfaces/session-interfaces';
import { UserInterface } from '@/interfaces/user-interfaces';
import { AppState } from '@/stores/app-store';

interface State {
  user?: UserInterface;
  session?: SessionInterface;
  isProfileLoading?: boolean;
  isDark: boolean;
}

type Actions = {
  setUser: (user?: Partial<UserInterface>) => void;
  setSession: (session?: Partial<SessionInterface>) => void;
  setIsProfileLoading: (boolean?: boolean) => void;
  setIsDark: (isDark: boolean) => void;
};

export type AppSlice = State & Actions;

type AppSliceCreator = StateCreator<AppState, [], [], AppSlice>;

const initialState: State = {
  user: undefined,
  session: undefined,
  isProfileLoading: undefined,
  isDark: false,
};

export const createAppSlice =
  (initial?: Partial<State>): AppSliceCreator =>
  (set) => {
    return {
      ...initialState,
      ...initial,
      setUser: (user) =>
        set((state) => ({
          user: user
            ? state.user
              ? ({ ...state.user, ...user } as UserInterface)
              : (user as UserInterface)
            : undefined,
        })),
      setSession: (session) =>
        set((state) => ({
          session: session
            ? state.session
              ? ({ ...state.session, ...session } as SessionInterface)
              : (session as SessionInterface)
            : undefined,
        })),
      setIsProfileLoading: (boolean) => set({ isProfileLoading: boolean }),
      setIsDark: (isDark) => set({ isDark }),
    };
  };
