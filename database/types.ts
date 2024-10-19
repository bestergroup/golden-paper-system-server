export enum Table {
  KnexMigrations = 'knex_migrations',
  KnexMigrationsLock = 'knex_migrations_lock',
  Part = 'part',
  Role = 'role',
  User = 'user',
  UserPart = 'user_part',
  Service = 'service',
  Color = 'color',
  CarType = 'car_type',
  CarModel = 'car_model',
  ExpenseType = 'expense_type',
  Expense = 'expense',
  Item = 'item',
  Sell = 'sell',
  SellItem = 'sell_item',
  Reservation = 'reservation',
  Customer = 'customer',
  DeptPay = 'dept_pay',
}

export type Tables = {
  knex_migrations: KnexMigrations;
  knex_migrations_lock: KnexMigrationsLock;
  part: Part;
  role: Role;
  user: User;
  user_part: UserPart;
  expense: Expense;
  item: Item;
  sell: Sell;
  sell_item: SellItem;
  customer: Customer;
  mandub: Mandub;
  employee: Employee;
  dept_pay: DeptPay;
};
export type KnexMigrations = {
  id: number;
  name: string | null;
  batch: number | null;
  migration_time: Date | null;
  deleted: boolean;
};

export type KnexMigrationsLock = {
  index: number;
  is_locked: number | null;
  deleted: boolean;
};
export type DeptPay = {
  id: number;
  created_by: number;
  updated_by?: number;
  sell_id: number;
  customer_id: number;
  amount: number;
  date: Date;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// Role type
export type Role = {
  id: number;
  name: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// Part type
export type Part = {
  id: number;
  name: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// City type
export type City = {
  id: number;
  name: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// RolePart type
export type RolePart = {
  id: number;
  role_id: number;
  part_id: number;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// User type
export type User = {
  id: number;
  name: string;
  phone: string;
  username: string;
  password: string;
  street: string;
  city_id: number;
  role_id: number;
  image_name: string;
  image_url: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// UserPart type
export type UserPart = {
  id: number;
  user_id: number;
  part_id: number;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// Item type
export type Item = {
  id: number;
  image_name: string;
  image_url: string;
  name: string;
  barcode: string;
  type_id: number;
  type_name: string;
  item_produce_price: number;
  item_plural_sell_price: number;
  item_single_sell_price: number;
  item_plural_jumla_price: number;
  item_less_from: number;
  item_single_jumla_price: number;
  note?: string;
  quantity: number;
  deleted: boolean;
  item_per_cartoon: number;
  created_by: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
};

// Expense type
export type Expense = {
  id: number;
  created_by: number;
  updated_by?: number;
  price: number;
  date: Date | string;
  type_id: number;
  type_name: string;
  title: string;
  note?: string;
  fromCase: boolean;
  expense_by: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// Client type
export type Client = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  phone1?: string;
  city_id: number;
  street?: string;
  created_by: number;
  updated_by?: number;
  image_name: string;
  image_url: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// Employee type
export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  phone1?: string;
  city_id: number;
  street?: string;
  created_by: number;
  updated_by?: number;
  image_name: string;
  image_url: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// Mandub type
export type Mandub = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  phone1?: string;
  city_id: number;
  street?: string;
  created_by: number;
  updated_by?: number;
  image_name: string;
  image_url: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// Customer type
export type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  phone1?: string;
  city_id: number;
  street?: string;
  created_by: number;
  updated_by?: number;
  image_name: string;
  image_url: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// Config type
export type Config = {
  id: number;
  initial_money: number;
  item_less_from: number;
  item_single_sell_price: boolean;
  item_plural_sell_price: boolean;
  item_single_jumla_price: boolean;
  item_plural_jumla_price: boolean;
  show_cartoon: boolean;
  items_print_modal: boolean;
  pos_print_modal: boolean;
  report_print_modal: boolean;
  show_single_quantity: boolean;
  show_dashboard_single_quantity: boolean;
  show_dashboard_cartoon: boolean;

  add_cartoon: boolean;
  add_single_quantity: boolean;
  sell_cartoon: boolean;
  sell_single_quantity: boolean;
  created_at: Date | null;
  updated_at: Date | null;
};

// Sell type
export type Sell = {
  id: number;
  created_by: number;
  updated_by?: number;
  mandub_id: number;
  customer_id: number;
  customer_first_name: string;
  customer_last_name: string;
  mandub_first_name: string;
  mandub_last_name: string;
  discount: number;
  dept: boolean;
  date: Date;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

// SellItem type
export type SellItem = {
  id: number;

  sell_id: number;
  created_by: number;
  updated_by?: number;
  item_id: number;
  item_name: string;
  item_per_cartoon: number;

  quantity: number;
  item_produce_price: number;
  item_sell_price: number;

  deleted: boolean;
  self_deleted: boolean;
  created_at: Date;
  updated_at: Date;
};
export type Backup = {
  id: number;
  table: string;
  user_id: number;
  created_at: Date | null;
  updated_at: Date | null;
};

export type BackupWithUser = {
  id: number;
  table: string;
  user_id: number;
  user_name: string;
  user_role: string;
  created_at: Date | null;
  updated_at: Date | null;
};

export type ItemQuantityHistory = {
  id: number;
  created_by: number;
  item_id: number;
  quantity: number;
  item_produce_price: number;
  item_plural_sell_price: number;
  item_single_sell_price: number;
  item_plural_jumla_price: number;
  item_single_jumla_price: number;
  item_name: string;
  item_barcode: string;
  created_at: Date;
  updated_at: Date;
};

export type ItemCartoonHistory = {
  id: number;
  created_by: number;
  item_id: number;
  item_per_cartoon: number;
  item_produce_price: number;
  item_plural_sell_price: number;
  item_single_sell_price: number;
  item_plural_jumla_price: number;
  item_single_jumla_price: number;
  item_name: string;
  item_barcode: string;
  created_at: Date;
  updated_at: Date;
};

export type ItemType = {
  id: number;
  name: string;
  created_at: Date | null;
  updated_at: Date | null;
  deleted: boolean;
};
export type ExpenseType = {
  id: number;
  name: string;
  created_at: Date | null;
  updated_at: Date | null;
  deleted: boolean;
};
export type Printer = {
  id: number;
  name: string;
  active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  deleted: boolean;
};
