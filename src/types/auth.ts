import { Role, User } from 'database/types';
import { Id } from './global';

export type CreateUserParams = {
  username: string;
  password: string;
};

export type UserWithRole = User & {
  role: Role;
};

export type UserWithRoleAndPart = UserWithRole & {
  parts: { id: Id; name: string }[];
};

export type Token = string;

export type AuthQ = {
  user: UserWithRole;
};
export type LoginQ = AuthQ & {
  token: Token;
};

export type JWTPayload = {
  id: Id;
  username: string;
};
