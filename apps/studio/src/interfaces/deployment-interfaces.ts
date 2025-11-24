export enum DeploymentType {
  PREVIEW = 'PREVIEW',
  PRODUCTION = 'PRODUCTION',
}
export enum DeploymentStatus {
  QUEUED = 'QUEUED',
  BUILDING = 'BUILDING',
  ERROR = 'ERROR',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  CANCELED = 'CANCELED',
}
export interface DeploymentInterface {
  _id: string;
  type: DeploymentType;
  domain?: string;
  projectId: string;
  sandboxId?: string;
  status: DeploymentStatus;
  message?: string; // Deployment message/description
  promotedFrom?: string; // ID of preview deployment that was promoted
  promotedAt?: Date; // When preview was promoted to production
  rolledBackFrom?: string;
  rolledBackAt?: Date;
  rolledBackTo?: string;
  isRollingBack?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
