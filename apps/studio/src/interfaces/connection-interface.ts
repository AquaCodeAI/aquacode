export interface ConnectionSchemaFieldInterface {
  name: string;
  type: string;
  required?: boolean;
  trim?: boolean;
  maxlength?: number;
  default?: any;
  enum?: string[];
  ref?: string;
}

export interface ConnectionSchemaItemInterface {
  name: string; // User
  prefix?: string; // usr_{id}
  fields: ConnectionSchemaFieldInterface[];
}

export interface IConnectionInterface {
  _id: string; // con_GK8QqrQrx5PM7LSl;
  name: string; // Aqua-Connection
  schemas: ConnectionSchemaItemInterface[];
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}
