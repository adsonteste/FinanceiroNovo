import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import {
  FinancialData,
  Income,
  Expense,
  FixedExpense,
  SavingsGoal,
  Notification,
  PendingIncome,
} from '../types/finance';
import {
  getNotifications,
  saveNotifications,
  getTheme,
  saveTheme,
} from '../utils/storage';

interface User {
  id: string;
  phone: string;
  name: string;
}

interface FinanceContextType {
  data: FinancialData;
  notifications: Notification[];
  theme: 'light' | 'dark';
  currentUser: User | null;
  loading: boolean;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addFixedExpense: (expense: Omit<FixedExpense, 'id' | 'createdAt'>) => Promise<void>;
  updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;
  setSavingsGoal: (month: string, target: number) => Promise<void>;
  addPendingIncome: (pendingIncome: Omit<PendingIncome, 'id' | 'createdAt' | 'converted'>) => Promise<void>;
  convertPendingToIncome: (id: string) => Promise<void>;
  deletePendingIncome: (id: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  toggleTheme: () => void;
  setCurrentUser: (user: User | null) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FinancialData>({
    incomes: [],
    expenses: [],
    fixedExpenses: [],
    savingsGoals: [],
    pendingIncomes: [],
  });
  const [notifications, setNotifications] = useState<Notification[]>(getNotifications());
  const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

useEffect(() => {
  if (!currentUser) return;

  loadFinancialData();

  // Subscrições em tempo real
  const tables = ['transactions', 'fixed_expenses', 'savings_goals'];
  const channels = tables.map((table) =>
    supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          console.log(`📡 Atualização em ${table}:`, payload);
          loadFinancialData(); // atualiza tela automaticamente
        }
      )
      .subscribe()
  );

  return () => {
    channels.forEach((ch) => ch.unsubscribe());
  };
}, [currentUser]);



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

  const loadFinancialData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [transactions, fixedExpenses, savingsGoals] = await Promise.all([
        supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
        supabase.from('fixed_expenses').select('*').order('due_day', { ascending: true }),
        supabase.from('savings_goals').select('*').order('month', { ascending: false }),
      ]);

      const incomes: Income[] = [];
      const expenses: Expense[] = [];
      const pendingIncomes: PendingIncome[] = [];

      (transactions.data || []).forEach((t: any) => {
        if (t.type === 'income' && t.status === 'completed') {
          incomes.push({
            id: t.id,
            value: parseFloat(t.value),
            date: t.transaction_date,
            category: t.category,
            description: t.description,
            userId: t.user_id,
            userName: t.user_name,
            createdAt: t.created_at,
          });
        } else if (t.type === 'expense' && t.status === 'completed') {
          expenses.push({
            id: t.id,
            value: parseFloat(t.value),
            date: t.transaction_date,
            category: t.category,
            description: t.description,
            userId: t.user_id,
            userName: t.user_name,
            createdAt: t.created_at,
          });
        } else if (t.type === 'pending_income' && t.status !== 'converted') {
          pendingIncomes.push({
            id: t.id,
            value: parseFloat(t.value),
            description: t.description,
            category: t.category,
            expectedDate: t.expected_date,
            createdDate: t.transaction_date,
            userId: t.user_id,
            userName: t.user_name,
            converted: t.status === 'converted',
            createdAt: t.created_at,
          });
        }
      });

      setData({
        incomes,
        expenses,
        fixedExpenses: (fixedExpenses.data || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          value: parseFloat(f.value),
          dueDay: f.due_day,
          month: f.month,
          isPaid: f.is_paid,
          paidByUserId: f.paid_by_user_id,
          paidByUserName: f.paid_by_user_name,
          paymentDate: f.payment_date,
          createdAt: f.created_at,
        })),
        savingsGoals: (savingsGoals.data || []).map((g: any) => ({
          id: g.id,
          month: g.month,
          target: parseFloat(g.target),
          createdAt: g.created_at,
        })),
        pendingIncomes,
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (currentUser) {
    loadFinancialData();

    const channel = setupRealtimeSubscriptions(); // ⬅️ agora retorna o canal

    return () => {
      channel.unsubscribe(); // ⬅️ fecha o mesmo canal criado
    };
  }
}, [currentUser]);

// 🔧 Refeito para ouvir várias tabelas
const setupRealtimeSubscriptions = () => {
  const tables = ['transactions', 'fixed_expenses', 'savings_goals'];

  tables.forEach((table) => {
    supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          console.log(`📡 Atualização detectada em ${table}:`, payload);
          loadFinancialData(); // Atualiza a tela sem F5
        }
      )
      .subscribe();
  });

  console.log('✅ Subscrições em tempo real configuradas para todas as tabelas');
};


  
  const addIncome = async (income: Omit<Income, 'id' | 'createdAt'>) => {
  if (!currentUser) return;
  try {
    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert({
        type: 'income',
        value: income.value,
        transaction_date: income.date,
        category: income.category,
        description: income.description,
        status: 'completed',
        user_id: income.userId || currentUser.id,
        user_name: income.userName || currentUser.name,
      })
      .select('*') // ⬅️ retorna o registro inserido
      .single();

    if (error) throw error;

    // ⚡ Atualiza o estado imediatamente (otimista)
    setData((prev) => ({
      ...prev,
      incomes: [
        {
          id: inserted.id,
          value: inserted.value,
          date: inserted.transaction_date,
          category: inserted.category,
          description: inserted.description,
          userId: inserted.user_id,
          userName: inserted.user_name,
          createdAt: inserted.created_at,
        },
        ...prev.incomes,
      ],
    }));
  } catch (error) {
    console.error('Error adding income:', error);
  }
};


  const updateIncome = async (id: string, income: Partial<Income>) => {
    try {
      const updateData: any = {};
      if (income.value !== undefined) updateData.value = income.value;
      if (income.date !== undefined) updateData.transaction_date = income.date;
      if (income.category !== undefined) updateData.category = income.category;
      if (income.description !== undefined) updateData.description = income.description;

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating income:', error);
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          type: 'expense',
          value: expense.value,
          transaction_date: expense.date,
          category: expense.category,
          description: expense.description,
          status: 'completed',
          user_id: expense.userId || currentUser.id,
          user_name: expense.userName || currentUser.name,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      const updateData: any = {};
      if (expense.value !== undefined) updateData.value = expense.value;
      if (expense.date !== undefined) updateData.transaction_date = expense.date;
      if (expense.category !== undefined) updateData.category = expense.category;
      if (expense.description !== undefined) updateData.description = expense.description;

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const addFixedExpense = async (expense: Omit<FixedExpense, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .insert({
          name: expense.name,
          value: expense.value,
          due_day: expense.dueDay,
          month: expense.month,
          is_paid: expense.isPaid || false,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding fixed expense:', error);
    }
  };

  const updateFixedExpense = async (id: string, expense: Partial<FixedExpense>) => {
    try {
      const updateData: any = {};
      if (expense.name !== undefined) updateData.name = expense.name;
      if (expense.value !== undefined) updateData.value = expense.value;
      if (expense.dueDay !== undefined) updateData.due_day = expense.dueDay;
      if (expense.isPaid !== undefined) {
        updateData.is_paid = expense.isPaid;
        if (expense.isPaid && currentUser) {
          updateData.paid_by_user_id = currentUser.id;
          updateData.paid_by_user_name = currentUser.name;
          updateData.payment_date = new Date().toISOString().split('T')[0];
        }
      }

      const { error } = await supabase
        .from('fixed_expenses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating fixed expense:', error);
    }
  };

  const deleteFixedExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting fixed expense:', error);
    }
  };

  const setSavingsGoal = async (month: string, target: number) => {
    try {
      const existing = data.savingsGoals.find((g) => g.month === month);

      if (existing) {
        const { error } = await supabase
          .from('savings_goals')
          .update({ target })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('savings_goals')
          .insert({ month, target });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error setting savings goal:', error);
    }
  };

  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(),
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

  const addPendingIncome = async (pendingIncome: Omit<PendingIncome, 'id' | 'createdAt' | 'converted'>) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          type: 'pending_income',
          value: pendingIncome.value,
          description: pendingIncome.description,
          category: pendingIncome.category,
          transaction_date: pendingIncome.createdDate,
          expected_date: pendingIncome.expectedDate,
          status: 'pending',
          user_id: pendingIncome.userId,
          user_name: pendingIncome.userName,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding pending income:', error);
    }
  };

  const convertPendingToIncome = async (id: string) => {
    try {
      const pendingIncome = data.pendingIncomes.find((p) => p.id === id);
      if (!pendingIncome || pendingIncome.converted) return;

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          type: 'income',
          value: pendingIncome.value,
          transaction_date: new Date().toISOString().split('T')[0],
          category: pendingIncome.category,
          description: `${pendingIncome.description} (Creditado)`,
          status: 'completed',
          user_id: pendingIncome.userId,
          user_name: pendingIncome.userName,
          converted_from_pending_id: id,
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'converted' })
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error converting pending income:', error);
    }
  };

  const deletePendingIncome = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting pending income:', error);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        data,
        notifications,
        theme,
        currentUser,
        loading,
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
        addPendingIncome,
        convertPendingToIncome,
        deletePendingIncome,
        addNotification,
        markNotificationAsRead,
        clearNotifications,
        toggleTheme,
        setCurrentUser,
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
