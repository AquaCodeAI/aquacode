export interface SessionInterface {
  _id: string;
  expiresAt: Date;
  userId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}
