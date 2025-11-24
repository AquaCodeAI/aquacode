export enum SandboxStatus {
  INITIALIZING = 'INITIALIZING',
  INITIALIZED = 'INITIALIZED',
  CLOSED = 'CLOSED',
  FAILED = 'FAILED',
}
export interface SandboxInterface {
  _id: string;
  domain: string;
  projectId: string;
  requestedAt?: Date;
  status: SandboxStatus;
  lastActivityAt?: Date;
  sandboxesMetaData: {
    vercel: {
      sandboxId: string;
      memory?: number | null;
      vcpus?: number | null;
      region?: string | null;
      runtime?: string | null;
      timeout?: number | null;
      status?: string | null;
      requestedAt?: Date | null;
      cwd?: string | null;
      createdAt?: Date | null;
      updatedAt?: Date | null;
    };
  };
  createdAt?: Date;
  updatedAt?: string;
}
