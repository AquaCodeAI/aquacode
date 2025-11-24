'use client';

import { useCallback, useEffect, useState, WheelEvent } from 'react';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { IConnectionInterface, ConnectionSchemaItemInterface } from '@/interfaces/connection-interface';
import { ItemResponseInterface, ListResponseInterface } from '@/interfaces/response-interfaces';
import { cn } from '@/utils/cn';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';
import { WorkspaceModalBase } from './workspace-modal-base';
import { WorkspaceLoadingState, WorkspaceModalErrorState, WorkspaceModalEmptyState } from './workspace-modal-states';
import { ProjectContentCreateDocumentModal } from './project-content-create-document-modal';

interface ProjectContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: string;
}

export function ProjectContentModal({ isOpen, onClose, connection }: ProjectContentModalProps) {
  const [connectionData, setConnectionData] = useState<IConnectionInterface | null>(null);
  const [connectionLoading, setConnectionLoading] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [documents, setDocuments] = useState<Record<string, any>[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const fetchConnection = useCallback(async () => {
    if (!connection) return;

    try {
      setConnectionLoading(true);
      setConnectionError(null);

      const { data } = await fetchClient<ItemResponseInterface<IConnectionInterface>>({
        url: `/v1/connections/${connection}`,
      });

      setConnectionData(data.result);

      if (data.result?.schemas && data.result.schemas.length > 0) {
        setSelectedSchema(data.result.schemas[0].name);
      }
    } catch (error) {
      const errorMsg =
        error instanceof FetchClientError && error.response?.data?.errors
          ? error.response.data.errors.join(', ')
          : 'Connection could not be loaded. Please try again.';
      setConnectionError(errorMsg);
    } finally {
      setConnectionLoading(false);
    }
  }, [connection]);

  const fetchDocuments = useCallback(
    async (schema: string) => {
      if (!connection || !schema) return;

      try {
        setDocumentsLoading(true);
        setDocumentsError(null);

        const { data } = await fetchClient<ListResponseInterface<Record<string, any>>>({
          url: `/v1/documents`,
          params: {
            __c: connection,
            __s: schema,
          },
        });

        setDocuments(data.result || []);
      } catch (error) {
        const errorMsg =
          error instanceof FetchClientError && error.response?.data?.errors
            ? error.response.data.errors.join(', ')
            : 'Documents could not be loaded. Please try again.';
        setDocumentsError(errorMsg);
      } finally {
        setDocumentsLoading(false);
      }
    },
    [connection]
  );

  useEffect(() => {
    if (isOpen) {
      fetchConnection().then();
    }
  }, [isOpen, fetchConnection]);

  useEffect(() => {
    if (selectedSchema) {
      fetchDocuments(selectedSchema).then();
    }
  }, [selectedSchema, fetchDocuments]);

  const handleSelectSchema = (schemaName: string) => {
    setSelectedSchema(schemaName);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!connection || !selectedSchema || !documentId) return;

    try {
      setDeletingDocumentId(documentId);

      await fetchClient({
        url: `/v1/documents/${documentId}`,
        method: 'DELETE',
        params: {
          __c: connection,
          __s: selectedSchema,
        },
      });

      setDocuments((prev) => prev.filter((doc) => doc._id !== documentId));
    } catch (error) {
      const errorMsg =
        error instanceof FetchClientError && error.response?.data?.errors
          ? error.response.data.errors.join(', ')
          : 'Document could not be deleted. Please try again.';

      console.error('Error deleting document:', errorMsg);
      setDocumentsError(errorMsg);
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleOpenCreateModal = () => {
    if (selectedSchema) {
      setIsCreateModalOpen(true);
    }
  };

  const handleDocumentCreated = () => {
    if (selectedSchema) {
      fetchDocuments(selectedSchema).then();
    }
  };

  const getSelectedSchemaData = (): ConnectionSchemaItemInterface | null => {
    if (!connectionData?.schemas || !selectedSchema) return null;
    return connectionData.schemas.find((s) => s.name === selectedSchema) || null;
  };

  const onValueWheel = (e: WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <WorkspaceModalBase isOpen={isOpen} onClose={onClose} title='Project Content'>
        {connectionLoading ? (
          <WorkspaceLoadingState />
        ) : connectionError ? (
          <WorkspaceModalErrorState message={connectionError} />
        ) : !connectionData?.schemas || connectionData.schemas.length === 0 ? (
          <WorkspaceModalEmptyState message='No schemas found' />
        ) : (
          <div className='rounded-xl'>
            <div className='mb-3 overflow-x-auto px-0.5'>
              <div className='flex min-w-max gap-2'>
                <Button
                  size='xs'
                  radius='full'
                  border='1'
                  className='border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600'
                  isIconOnly={true}
                  isDisabled={!selectedSchema}
                  onPress={handleOpenCreateModal}
                  aria-label='Add document'
                >
                  <PlusIcon className='h-4 w-4' />
                </Button>
                {connectionData.schemas.map((schema) => {
                  const isActive = selectedSchema === schema.name;
                  return (
                    <Button
                      size='xs'
                      key={schema.name}
                      radius='full'
                      border='1'
                      className={cn(
                        'border px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                        isActive
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                          : 'border-neutral-200 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600'
                      )}
                      onClick={() => handleSelectSchema(schema.name)}
                    >
                      {schema.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {!selectedSchema ? (
              <WorkspaceModalEmptyState message='Choose a schema from the list to load its documents.' />
            ) : documentsLoading ? (
              <WorkspaceLoadingState />
            ) : documentsError ? (
              <WorkspaceModalErrorState message={documentsError} />
            ) : documents.length === 0 ? (
              <WorkspaceModalEmptyState message='No data for this schema.' />
            ) : (
              <div className='flex flex-col gap-3'>
                {documents.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className='group scroll relative max-h-96 w-full touch-pan-y overflow-y-auto overscroll-contain rounded-lg border border-neutral-200 bg-white p-3 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                  >
                    <Button
                      size='xs'
                      type='button'
                      disabled={deletingDocumentId === item._id}
                      className={cn(
                        'absolute top-2 right-2',
                        'flex h-7 w-7 items-center justify-center',
                        'rounded-lg border bg-white shadow-sm',
                        'opacity-0 group-hover:opacity-100',
                        'transition-all',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                      )}
                      aria-label='Delete document'
                      isIconOnly={true}
                      onClick={() => handleDeleteDocument(item._id)}
                    >
                      <TrashIcon className='h-4 w-4' />
                    </Button>

                    {Object.entries(item).map(([k, v]) => (
                      <div key={k} className='flex min-w-0 items-start gap-2'>
                        <span className='shrink-0 text-neutral-600 dark:text-neutral-400'>{k}</span>
                        <span className='shrink-0 text-neutral-400 dark:text-neutral-500'>:</span>
                        <div className='scroll max-w-full min-w-0 flex-1 overflow-x-auto' onWheel={onValueWheel}>
                          <span className='inline-block whitespace-nowrap'>
                            {typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
                              ? String(v)
                              : Array.isArray(v) || typeof v === 'object'
                                ? JSON.stringify(v)
                                : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </WorkspaceModalBase>

      {/* Create Document Modal - Fuera del modal padre */}
      {selectedSchema && getSelectedSchemaData() && (
        <ProjectContentCreateDocumentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          connection={connection}
          schema={getSelectedSchemaData()!}
          onDocumentCreated={handleDocumentCreated}
        />
      )}
    </>
  );
}
