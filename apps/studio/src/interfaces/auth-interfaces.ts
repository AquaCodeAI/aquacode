import { UserInterface } from '@/interfaces/user-interfaces';

export interface SignInInterface {
  token: string;
  user: UserInterface;
}
export interface SignUpInterface {
  token: string;
  user: UserInterface;
}
export interface SignOutInterface {
  success: boolean;
}
