import {
  Income,
  Expense,
  FixedExpense,
  SavingsGoal,
  FilterOptions,
} from '../types/finance';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const filterByDate = <T extends { date: string }>(
  items: T[],
  startDate?: string,
  endDate?: string
): T[] => {
  return items.filter((item) => {
    const itemDate = new Date(item.date);
    if (startDate && itemDate < new Date(startDate)) return false;
    if (endDate && itemDate > new Date(endDate)) return false;
    return true;
  });
};

export const filterByMonth = <T extends { date: string }>(
  items: T[],
  month: string
): T[] => {
  return items.filter((item) => item.date.startsWith(month));
};

export const getWeekRange = (): { start: string; end: string } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export const calculateTotalIncome = (incomes: Income[], month?: string): number => {
  const filtered = month ? filterByMonth(incomes, month) : incomes;
  return filtered.reduce((sum, income) => sum + income.value, 0);
};

export const calculateTotalExpenses = (expenses: Expense[], month?: string): number => {
  const filtered = month ? filterByMonth(expenses, month) : expenses;
  return filtered.reduce((sum, expense) => sum + expense.value, 0);
};

export const calculateTotalFixedExpenses = (
  fixedExpenses: FixedExpense[],
  month?: string
): number => {
  const filtered = month
    ? fixedExpenses.filter((fe) => fe.month === month)
    : fixedExpenses;
  return filtered.reduce((sum, expense) => sum + expense.value, 0);
};

export const calculateSavings = (
  incomes: Income[],
  expenses: Expense[],
  fixedExpenses: FixedExpense[],
  month: string
): number => {
  const totalIncome = calculateTotalIncome(incomes, month);
  const totalExpenses = calculateTotalExpenses(expenses, month);
  const totalFixedPaid = fixedExpenses
    .filter((f) => f.month === month && f.isPaid)
    .reduce((sum, f) => sum + f.value, 0);
  return totalIncome - totalExpenses - totalFixedPaid;
};

export const calculateSavingsProgress = (
  saved: number,
  goal: number
): number => {
  if (goal === 0) return 0;
  return Math.min((saved / goal) * 100, 100);
};

export const getExpensesByCategory = (
  expenses: Expense[],
  month?: string
): Record<string, number> => {
  const filtered = month ? filterByMonth(expenses, month) : expenses;
  return filtered.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.value;
    return acc;
  }, {} as Record<string, number>);
};

export const getWeeklyAverage = (expenses: Expense[], weeks: number = 4): number => {
  const now = new Date();
  const weeksAgo = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  const filtered = expenses.filter((e) => new Date(e.date) >= weeksAgo);
  const total = filtered.reduce((sum, e) => sum + e.value, 0);
  return total / weeks;
};

export const getSavingsPercentage = (saved: number, totalIncome: number): number => {
  if (totalIncome === 0) return 0;
  return (saved / totalIncome) * 100;
};
