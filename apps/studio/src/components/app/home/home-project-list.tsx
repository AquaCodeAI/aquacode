'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import HomeProjectListContent from '@/components/app/home/home-project-list-content';
import HomeProjectListHeader from '@/components/app/home/home-project-list-header';
import HomeProjectListSkeleton from '@/components/app/home/home-project-list-skeleton';
import { useAppStore } from '@/hooks/use-app-store';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import type { ListResponseInterface } from '@/interfaces/response-interfaces';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';

// Pagination Configuration
const PROJECTS_PER_PAGE = 6;

// Header Configuration
const PROJECT_LIST_HEADER_TITLE = 'Your projects';
const PROJECT_LIST_HEADER_SUBTITLE = 'Here you can see all your projects';

// Error Messages
const ERROR_PROJECTS_LOAD_FAILED = 'Projects could not be loaded. Please try again.';
const ERROR_UNEXPECTED = 'An unexpected error has occurred.';

// UI Labels
const BUTTON_LABEL_LOADING = 'Loading...';
const BUTTON_LABEL_VIEW_MORE = 'View more';

export default function HomeProjectList() {
  // Auth State
  const session = useAppStore((s) => s.session);
  const user = useAppStore((s) => s.user);

  // Projects State
  const [projects, setProjects] = useState<ProjectInterface[]>([]);
  const [areProjectsLoading, setAreProjectsLoading] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);

  const loadProjects = useCallback(async (page: number = 1, shouldResetData: boolean = false) => {
    try {
      if (shouldResetData || page === 1) {
        setAreProjectsLoading(true);
      } else {
        setIsPaginationLoading(true);
      }

      setProjectsError(null);

      const { data } = await fetchClient<ListResponseInterface<ProjectInterface>>({
        url: `/v1/projects`,
        params: {
          page,
          perPage: PROJECTS_PER_PAGE,
        },
      });

      const fetchedProjects = data.result;
      const { page: currentPageInfo, totalCount: total } = data.resultInfo;

      setProjects((prev) => (shouldResetData || page === 1 ? fetchedProjects : [...prev, ...fetchedProjects]));
      setTotalProjectsCount(total);
      setCurrentPage(currentPageInfo);
      setHasMorePages(currentPageInfo * PROJECTS_PER_PAGE < total);
    } catch (error) {
      if (error instanceof FetchClientError && error.response?.data) {
        const responseData = error.response.data as ListResponseInterface<ProjectInterface>;
        if (responseData.errors && responseData.errors.length > 0) {
          setProjectsError(responseData.errors.join(', '));
        } else {
          setProjectsError(ERROR_PROJECTS_LOAD_FAILED);
        }
      } else {
        setProjectsError(ERROR_UNEXPECTED);
      }
    } finally {
      setAreProjectsLoading(false);
      setIsPaginationLoading(false);
    }
  }, []);

  const loadMoreProjects = useCallback(() => {
    if (!isPaginationLoading && hasMorePages) {
      loadProjects(currentPage + 1, false).then();
    }
  }, [currentPage, hasMorePages, isPaginationLoading, loadProjects]);

  // Load projects when user is authenticated
  useEffect(() => {
    if (session && user) {
      loadProjects(1, true).then();
    }
  }, [session, user, loadProjects]);

  const isUserAuthenticated = !!session && !!user;
  if (!isUserAuthenticated) return null;

  return (
    <div className='mt-16 w-full max-w-3xl px-4 md:px-5'>
      <div className='w-full'>
        {areProjectsLoading ? (
          <HomeProjectListSkeleton />
        ) : (
          <>
            <HomeProjectListHeader
              title={PROJECT_LIST_HEADER_TITLE}
              subtitle={PROJECT_LIST_HEADER_SUBTITLE}
              totalCount={totalProjectsCount}
            />
            <HomeProjectListContent projects={projects} errorMessage={projectsError} />

            {hasMorePages && (
              <div className='mt-6 md:mt-8'>
                <Button
                  type='button'
                  variant='outline'
                  radius='full'
                  aria-label='View more projects'
                  className='text-foreground/80 w-full border border-black/10 py-3 text-sm font-medium dark:border-white/20 dark:text-white/80'
                  onClick={loadMoreProjects}
                  disabled={isPaginationLoading}
                >
                  {isPaginationLoading ? BUTTON_LABEL_LOADING : BUTTON_LABEL_VIEW_MORE}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
