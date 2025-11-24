export enum MessageRol {
  AI = 'AI',
  USER = 'USER',
}
export enum IMessageStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
export interface MessageInterface {
  _id: string;
  role: MessageRol;
  content: string;
  userId?: string;
  status: IMessageStatus;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}
