import { FC, ReactNode } from 'react';

export type NextLayout = FC<{
  children: ReactNode;
  params: Promise<{ [key: string]: string }>;
}>;
export type NextPage = FC<{
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}>;
