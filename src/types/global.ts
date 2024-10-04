import {
  Backup,
  CaseHistory,
  City,
  Customer,
  Expense,
  Item,
  ItemQuantityHistory,
  Sell,
  SellItem,
  User,
} from 'database/types';
import { UserWithRole, UserWithRoleAndPart } from './auth';
import { ExpenseWithType } from './expense';
import { RoleWithItsParts } from './role-part';

export type Id = number;

export type Page = undefined | number;
export type Search = undefined | string;
export type Filter = undefined | string;
export type From = undefined | string;
export type Date = undefined | string;

export type To = undefined | string;

export type Limit = undefined | number;
export type Status = 400 | 401 | 402 | 403 | 404 | 500;
export type DataTypes =
  | UserWithRoleAndPart
  | UserWithRole[]
  | UserWithRoleAndPart[]
  | Expense[]
  | Customer[]
  | Item[]
  | ExpenseWithType[]
  | RoleWithItsParts[]
  | Sell[]
  | SellItem[]
  | Backup[]
  | CaseHistory[]
  | City[]
  | ItemQuantityHistory[]
  | CaseReport[];
export type Tables = User | Expense | Customer | Item | Sell | SellItem;

export type PaginationObject<T extends DataTypes> = {
  paginatedData: T;
  meta: {
    nextPageUrl: string;
    total: number;
  };
};

export type PaginationReturnType<T extends DataTypes> = PaginationObject<T>;
export type CaseReport = {
  id: number;
  created_by: number;
  sold: number | string;
  sold_price: number | string;
};
