import { io, Socket } from 'socket.io-client';
import { StateCreator } from 'zustand/vanilla';
import { AppState } from '@/stores/app-store';
import { logger } from '@/utils/logger';

type RealtimeMessage<T = unknown> = {
  eventName: string;
  eventData: T;
};

interface State {
  socket?: Socket;
  events: RealtimeMessage[];
}

type Actions = {
  connectSocket: (sessionToken?: string) => void;
  disconnectSocket: () => void;
  clearEvents: () => void;
  getEventsByName: (name: string) => RealtimeMessage[];
  getLastByName: (name: string) => RealtimeMessage | undefined;
};

export type AppSocketSlice = State & Actions;

type AppSliceCreator = StateCreator<AppState, [], [], AppSocketSlice>;

const MAX_EVENTS = 1000;

const initialState: State = {
  socket: undefined,
  events: [],
};

export const createAppSocketSlice: AppSliceCreator = (set, get) => {
  return {
    ...initialState,
    connectSocket: (sessionToken) => {
      const { socket: currentSocket } = get();
      if (currentSocket || !sessionToken) return;

      const aquaDomain = process.env.NEXT_PUBLIC_AQUA_DOMAIN!;
      const socket = io(`${aquaDomain}/messenger`, {
        auth: {
          projectId: process.env.NEXT_PUBLIC_AQUA_PROJECT_ID!,
          token: `Bearer ${sessionToken}`,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socket.on('connect', () => {
        logger.debug('Messenger Connection Connect:', socket.id);
      });

      socket.on('connect_error', (err) => {
        logger.debug('Messenger Connection Error:', err);
      });

      socket.on('disconnect', (reason) => {
        logger.debug('Messenger Connection Disconnect:', reason);
      });

      socket.on('messenger', (message: RealtimeMessage) => {
        try {
          const eventName = message.eventName;
          const eventData = message?.eventData;
          const stored: RealtimeMessage = { eventName, eventData };

          set((appState) => {
            const next = [...appState.events, stored];
            const trimmed = next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
            return { events: trimmed };
          });

          logger.debug('RT event:', { eventCount: get().events.length, eventName });
        } catch (error: unknown) {
          logger.debug('RT event parse error:', error);
        }
      });

      set({ socket });
    },
    disconnectSocket: () => {
      get().socket?.removeAllListeners?.('message');
      get().socket?.removeAllListeners?.();
      get().socket?.disconnect();
      set({ socket: undefined });
    },
    clearEvents: () => set({ events: [] }),
    getEventsByName: (name: string) => get().events.filter((e) => e.eventName === name),
    getLastByName: (name: string) => {
      const list = get().events;
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].eventName === name) return list[i];
      }
      return undefined;
    },
  };
};
