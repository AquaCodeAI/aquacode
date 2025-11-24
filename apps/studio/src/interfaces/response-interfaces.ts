export interface ItemResponseInterface<T> {
  result: T;
  success: boolean;
  errors: string[];
  messages: string[];
}

export interface ListResponseInterface<T> {
  result: T[];
  resultInfo: {
    page: number;
    perPage: number;
    totalCount: number;
  };
  success: boolean;
  errors: string[];
  messages: string[];
}
