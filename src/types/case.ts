import { Item } from 'database/types';
import { Id } from './global';

export type CaseHistory = {
  situation: string;
  date: Date | Id;
  money: string;
  id: Id;
  type: 'داهات' | 'خەرجی';
  case_id: Id;
};

export type CaseChart = {
  type: 'داهات' | 'خەرجی';
  value: number;
  label: 'خەرجی' | 'داهات';
};

export type Money = string | number;

export type CaseMoney<T> = {
  id: Id;
  type: T;
  amount: Money;
};

export type CaseRevenue = CaseMoney<'revenue'>;
export type CaseExpense = CaseMoney<'expense'>;
export type CaseDept = CaseMoney<'dept'>;

export type ReportMoney = {
  id: Id;
  money: Money;
  expense: Money;
  dept: Money;
  dept_psula: ReportData;
  naqd_psula: ReportData;
  wasl_psula: ReportData;
  new_customers: ReportData;
  dept_amount: ReportData;
  date: Date | number;
};

export type ReportData = Id;
export type ReportChart = {
  id: Id;
  value: number;
  label: string;
};

export type Case = {
  id: Id;
  money: number;
};

export type GetCaseMoneyQ = Case;

export type GetCaseHistoryQ = CaseHistory[];

export type GetCaseChartQ = CaseChart[];

export type GetReportMoneyDataQ = ReportMoney;

export type GetReportMostItemQ = Item[];

export type GetReportMostOrderQ = ReportChart[];
