'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/ui';
import type { UserInterface } from '@/interfaces/user-interfaces';
import type { ListResponseInterface } from '@/interfaces/response-interfaces';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';
import { WorkspaceModalBase } from './workspace-modal-base';
import { WorkspaceLoadingState, WorkspaceModalErrorState, WorkspaceModalEmptyState } from './workspace-modal-states';
import { UserDetailView } from './project-user-detail';

interface ProjectUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: string;
}

type ViewType = 'list' | 'detail';

interface NavigationState {
  view: ViewType;
  userId?: string;
}

// Pagination Configuration
const USERS_PER_PAGE = 250;

// Error Messages
const ERROR_USERS_LOAD_FAILED = 'Users could not be loaded. Please try again.';

// UI Messages
const MESSAGE_NO_USERS_FOUND = 'No users found';
const MESSAGE_USER_NOT_FOUND = 'User not found';
const MESSAGE_DESCRIPTION = 'View and control everything related to your user management.';

// Modal Titles
const TITLE_USER_LIST = 'User Management';
const TITLE_USER_DETAIL = 'User Details';

// Navigation Configuration
const INITIAL_VIEW: NavigationState = { view: 'list' };
const INITIAL_HISTORY_INDEX = 0;

export function ProjectUsersModal({ isOpen, onClose, connection }: ProjectUsersModalProps) {
  // Navigation State
  const [navigationHistory, setNavigationHistory] = useState<NavigationState[]>([INITIAL_VIEW]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(INITIAL_HISTORY_INDEX);

  // Users State
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [areUsersLoading, setAreUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserInterface | null>(null);

  // Navigation helpers
  const currentView = navigationHistory[currentHistoryIndex];
  const canNavigateBack = currentHistoryIndex > 0;
  const canNavigateForward = currentHistoryIndex < navigationHistory.length - 1;

  const navigateToView = (newState: NavigationState) => {
    const newHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
    newHistory.push(newState);
    setNavigationHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
  };

  const navigateBack = () => {
    if (canNavigateBack) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    }
  };

  const navigateForward = () => {
    if (canNavigateForward) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  };

  const loadUsers = useCallback(
    async (page: number = 1) => {
      try {
        setAreUsersLoading(true);
        setUsersError(null);

        const { data } = await fetchClient<ListResponseInterface<UserInterface>>({
          url: '/v1/users',
          params: {
            page,
            perPage: USERS_PER_PAGE,
            connection,
          },
        });

        const fetchedUsers = data.result;
        setUsers((prev) => (page === 1 ? fetchedUsers : [...prev, ...fetchedUsers]));
      } catch (error) {
        if (error instanceof FetchClientError && error.response?.data?.errors) {
          setUsersError(error.response.data.errors.join(', '));
        } else {
          setUsersError(ERROR_USERS_LOAD_FAILED);
        }
      } finally {
        setAreUsersLoading(false);
      }
    },
    [connection]
  );

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers(1).then();
    }
  }, [isOpen, loadUsers]);

  // Update selected user when view changes
  useEffect(() => {
    const isDetailView = currentView.view === 'detail';
    const hasUserId = !!currentView.userId;

    if (isDetailView && hasUserId) {
      const foundUser = users.find((user) => user._id === currentView.userId);
      setSelectedUser(foundUser || null);
    }
  }, [currentView, users]);

  const handleUserClick = (user: UserInterface) => {
    navigateToView({ view: 'detail', userId: user._id });
  };

  const getModalTitle = () => {
    return currentView.view === 'list' ? TITLE_USER_LIST : TITLE_USER_DETAIL;
  };

  const hasNoUsers = users.length === 0;
  const isInitialLoading = areUsersLoading && hasNoUsers;

  const renderUserListItem = (user: UserInterface, index: number) => {
    const isNotFirstItem = index > 0;
    const displayName = user.name || user.email;

    return (
      <div
        key={user._id}
        onClick={() => handleUserClick(user)}
        className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${isNotFirstItem ? 'border-t border-neutral-200 dark:border-white/20' : ''}`}
      >
        <div className='flex items-center gap-3'>
          <Avatar size='sm' radius='full' name={displayName} src={user.avatar} />
          <div className='flex flex-col'>
            <span className='text-sm font-medium text-neutral-900 dark:text-white'>{displayName}</span>
            <span className='text-xs text-neutral-500 dark:text-neutral-300'>{user.email}</span>
          </div>
        </div>
        <ChevronRightIcon className='h-5 w-5 text-neutral-400 dark:text-neutral-500' />
      </div>
    );
  };

  const renderUserListView = () => {
    if (isInitialLoading) {
      return <WorkspaceLoadingState />;
    }

    if (usersError) {
      return <WorkspaceModalErrorState message={usersError} />;
    }

    if (hasNoUsers) {
      return <WorkspaceModalEmptyState message={MESSAGE_NO_USERS_FOUND} />;
    }

    return (
      <div className='rounded-xl border border-neutral-200 bg-white dark:border-white/20 dark:bg-neutral-800'>
        <div className='flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-white/20'>
          <p className='text-xs text-neutral-600 dark:text-neutral-300'>{MESSAGE_DESCRIPTION}</p>
        </div>
        {users.map((user, index) => renderUserListItem(user, index))}
      </div>
    );
  };

  const renderUserDetailView = () => {
    if (selectedUser) {
      return <UserDetailView user={selectedUser} />;
    }
    return <WorkspaceModalEmptyState message={MESSAGE_USER_NOT_FOUND} />;
  };

  return (
    <WorkspaceModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      onBack={navigateBack}
      onForward={navigateForward}
      canGoBack={canNavigateBack}
      canGoForward={canNavigateForward}
    >
      {currentView.view === 'list' ? renderUserListView() : renderUserDetailView()}
    </WorkspaceModalBase>
  );
}
