import { Spinner } from '@/components/ui';

export const WorkspaceLoadingState = () => (
  <div className='flex items-center justify-center py-8'>
    <Spinner size='lg' />
  </div>
);

export const WorkspaceModalErrorState = ({ message }: { message: string }) => (
  <div className='py-8 text-center text-red-500'>{message}</div>
);

export const WorkspaceModalEmptyState = ({ message }: { message: string }) => (
  <div className='py-8 text-center text-gray-500'>{message}</div>
);
