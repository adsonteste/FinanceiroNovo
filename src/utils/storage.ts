import { FinancialData, Notification } from '../types/finance';

const STORAGE_KEY = 'financial_data';
const NOTIFICATIONS_KEY = 'notifications';
const THEME_KEY = 'theme';

export const getFinancialData = (): FinancialData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {
      incomes: [],
      expenses: [],
      fixedExpenses: [],
      savingsGoals: [],
    };
  }
  return JSON.parse(data);
};

export const saveFinancialData = (data: FinancialData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getNotifications = (): Notification[] => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveNotifications = (notifications: Notification[]): void => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const getTheme = (): 'light' | 'dark' => {
  const theme = localStorage.getItem(THEME_KEY);
  return (theme as 'light' | 'dark') || 'light';
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(THEME_KEY, theme);
};

export const exportToJSON = (): void => {
  const data = getFinancialData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeiro_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToCSV = (): void => {
  const data = getFinancialData();
  const rows: string[] = [];

  rows.push('Tipo,Valor,Data,Categoria,Descrição');

  data.incomes.forEach((income) => {
    rows.push(
      `Entrada,${income.value},${income.date},${income.category},"${income.description}"`
    );
  });

  data.expenses.forEach((expense) => {
    rows.push(
      `Gasto,${expense.value},${expense.date},${expense.category},"${expense.description}"`
    );
  });

  data.fixedExpenses.forEach((fixed) => {
    rows.push(
      `Despesa Fixa,${fixed.value},${fixed.month}-${fixed.dueDay.toString().padStart(2, '0')},Fixa,"${fixed.name}"`
    );
  });

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
