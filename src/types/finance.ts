export type TransactionCategory =
  | 'salário'
  | 'venda'
  | 'bônus'
  | 'investimento'
  | 'outros';

export type ExpenseCategory =
  | 'alimentação'
  | 'transporte'
  | 'lazer'
  | 'contas'
  | 'saúde'
  | 'educação'
  | 'moradia'
  | 'outros';

export interface Income {
  id: string;
  value: number;
  date: string;
  category: TransactionCategory;
  description: string;
  createdAt: string;
  userId?: string;
  userName?: string;
}

export interface Expense {
  id: string;
  value: number;
  date: string;
  category: ExpenseCategory;
  description: string;
  createdAt: string;
  userId?: string;
  userName?: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  value: number;
  dueDay: number;
  isPaid: boolean;
  month: string;
  createdAt: string;
  paidByUserId?: string;
  paidByUserName?: string;
  paymentDate?: string;
}

export interface SavingsGoal {
  id: string;
  month: string;
  target: number;
  createdAt: string;
}

export interface PendingIncome {
  id: string;
  value: number;
  description: string;
  category: string;
  expectedDate: string;
  createdDate: string;
  userId: string;
  userName: string;
  converted: boolean;
  createdAt: string;
}

export interface FinancialData {
  incomes: Income[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  savingsGoals: SavingsGoal[];
  pendingIncomes: PendingIncome[];
}

export interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'income' | 'expense' | 'fixed';
}
