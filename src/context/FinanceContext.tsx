import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  FinancialData,
  Income,
  Expense,
  FixedExpense,
  SavingsGoal,
  Notification,
} from '../types/finance';
import {
  getFinancialData,
  saveFinancialData,
  getNotifications,
  saveNotifications,
  getTheme,
  saveTheme,
} from '../utils/storage';
import { generateId, getCurrentMonth } from '../utils/calculations';

interface FinanceContextType {
  data: FinancialData;
  notifications: Notification[];
  theme: 'light' | 'dark';
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addFixedExpense: (expense: Omit<FixedExpense, 'id' | 'createdAt'>) => void;
  updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;
  setSavingsGoal: (month: string, target: number) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  toggleTheme: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FinancialData>(getFinancialData());
  const [notifications, setNotifications] = useState<Notification[]>(getNotifications());
  const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    saveFinancialData(data);
  }, [data]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

 const addIncome = async (income: Omit<Income, 'id' | 'createdAt'>) => {
  const newIncome: Income = {
    ...income,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  // Atualiza localmente
  setData(prev => ({ ...prev, incomes: [...prev.incomes, newIncome] }));

  // Salva no storage ou Supabase
  await saveFinancialData({ ...data, incomes: [...data.incomes, newIncome] });
};


  const updateIncome = (id: string, income: Partial<Income>) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) => (i.id === id ? { ...i, ...income } : i)),
    }));
  };

  const deleteIncome = (id: string) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((i) => i.id !== id),
    }));
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
  };

  const updateExpense = (id: string, expense: Partial<Expense>) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...expense } : e)),
    }));
  };

  const deleteExpense = (id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const addFixedExpense = (expense: Omit<FixedExpense, 'id' | 'createdAt'>) => {
    const newExpense: FixedExpense = {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      fixedExpenses: [...prev.fixedExpenses, newExpense],
    }));
  };

 const updateFixedExpense = (id: string, expense: Partial<FixedExpense>) => {
  setData((prev) => {
    const updatedExpenses = prev.fixedExpenses.map((e) => {
      if (e.id === id) {
        const updated = { ...e, ...expense };

        // ✅ Só adiciona ao histórico se houve uma mudança real de "não pago" -> "pago"
        if (
          expense.hasOwnProperty('isPaid') && // <-- mudança veio do toggle
          updated.isPaid &&                   // agora está pago
          !e.isPaid                           // antes não estava
        ) {
          addExpense({
            value: updated.value,
            date: new Date().toISOString().split('T')[0],
            category: 'contas',
            description: `Pagamento: ${updated.name}`,
          });
        }

        return updated;
      }
      return e;
    });

      return {
        ...prev,
        fixedExpenses: updatedExpenses,
      };
    });
  };

  const deleteFixedExpense = (id: string) => {
    setData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((e) => e.id !== id),
    }));
  };

  const setSavingsGoal = (month: string, target: number) => {
    const existing = data.savingsGoals.find((g) => g.month === month);
    if (existing) {
      setData((prev) => ({
        ...prev,
        savingsGoals: prev.savingsGoals.map((g) =>
          g.month === month ? { ...g, target } : g
        ),
      }));
    } else {
      const newGoal: SavingsGoal = {
        id: generateId(),
        month,
        target,
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        savingsGoals: [...prev.savingsGoals, newGoal],
      }));
    }
  };

  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <FinanceContext.Provider
      value={{
        data,
        notifications,
        theme,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addFixedExpense,
        updateFixedExpense,
        deleteFixedExpense,
        setSavingsGoal,
        addNotification,
        markNotificationAsRead,
        clearNotifications,
        toggleTheme,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
