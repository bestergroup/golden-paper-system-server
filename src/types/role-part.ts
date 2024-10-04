import { Part, Role } from 'database/types';
import { Id } from './global';

export type RoleWithItsParts = Role & {
  parts: { id: Id; name: string }[];
};
export type RoleWithPartJoin = {
  id: Id;
  name: string;
};
