export type ENUM_TYPES =
  //GLOBAL
  | 'SEARCH_LIMIT'
  //PARTS
  | 'USERS_PART'
  | 'CUSTOMERS_PART'
  | 'EXPENSES_PART'
  | 'ROLES_PART'
  | 'KOGA_PART'
  | 'CREATE_PSULA_PART'
  | 'SELL_PART'
  | 'NORMAL_BACKUP_PART'
  | 'ITEM_TYPES_PART'
  | 'EXPENSE_TYPE_PART'
  | 'PRINTER_PART'
  | 'SERVER_BACKUP_PART'
  | 'MANDUBS_PART'
  | 'EMPLOYEES_PART'
  | 'DASHBOARD_PART'
  | 'SELL_REPORT_PART'
  | 'KOGA_REPORT_PART'
  | 'PROFIT_REPORT_PART'
  | 'CASE_REPORT_PART'
  | 'EXPENSE_REPORT_PART'
  | 'CITY_PART'
  | 'LESS_ITEM_PART'
  | 'DEPT_PART'
  | 'CONFIG_PART';

export const ENUMs: { [key in ENUM_TYPES]: key | string | number } = {
  //GLOBAL
  SEARCH_LIMIT: 30,
  //PARTS
  ITEM_TYPES_PART: 'جۆرەکانی بەرهەم',
  EXPENSE_TYPE_PART: 'جۆرەکانی خەرجی',
  PRINTER_PART: 'پرنتەرەکان',
  USERS_PART: 'بەکارهێنەران',
  CUSTOMERS_PART: 'کڕیارەکان',
  MANDUBS_PART: 'مەندووبەکان',
  EMPLOYEES_PART: `کارمەندەکان`,
  EXPENSES_PART: 'خەرجی',
  ROLES_PART: 'ڕۆڵەکان',
  KOGA_PART: 'کۆگا',
  CREATE_PSULA_PART: 'پسولەی فرۆشتن',
  SELL_PART: 'پسولەکان',
  NORMAL_BACKUP_PART: 'باکئەپی ئاسایی',
  SERVER_BACKUP_PART: 'باکئەپی سێرڤەر',
  DASHBOARD_PART: 'داشبۆرد',
  DEPT_PART: 'قەرزەکان',
  EXPENSE_REPORT_PART: 'ڕاپۆرتی خەرجی',

  SELL_REPORT_PART: 'ڕاپۆرتی فرۆشتن',
  CASE_REPORT_PART: 'ڕاپۆرتی قاسە',
  PROFIT_REPORT_PART: 'ڕاپۆرتی قازانج',
  KOGA_REPORT_PART: 'ڕاپۆرتی کۆگا',
  CITY_PART: `شارەکان`,
  LESS_ITEM_PART: 'مەوادی کەمبوو',
  CONFIG_PART: 'ڕێکخستن',
};
