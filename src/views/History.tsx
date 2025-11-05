import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContextSupabase';
import { Card, SimpleCard } from '../components/Card';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  User,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  getCurrentMonth,
  getMonthName,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateSavingsProgress,
  formatCurrency,
} from '../utils/calculations';

interface HistoryItem {
  id: string;
  type: 'income' | 'expense' | 'fixed' | 'pending';
  date: string;
  value: number;
  category: string;
  description: string;
  userName?: string;
  userSpent?: number;
}

export const History: React.FC = () => {
  const { data } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'fixed' | 'pending'>('all');

  const summary = useMemo(() => {
    const totalIncome = calculateTotalIncome(data.incomes, selectedMonth);
    const totalExpenses = calculateTotalExpenses(data.expenses, selectedMonth);
    const totalFixed = data.fixedExpenses
      .filter((f) => f.month === selectedMonth)
      .reduce((sum, f) => sum + f.value, 0);
    const totalFixedPaid = data.fixedExpenses
      .filter((f) => f.month === selectedMonth && f.isPaid)
      .reduce((sum, f) => sum + f.value, 0);
    const totalAllExpenses = totalExpenses + totalFixedPaid;
    const balance = totalIncome - totalExpenses - totalFixedPaid;
    const savings = totalIncome - totalExpenses - totalFixedPaid;
    const goal = data.savingsGoals.find((g) => g.month === selectedMonth);
    const savingsProgress = goal ? calculateSavingsProgress(savings, goal.target) : 0;

    const totalPending = data.pendingIncomes
      .filter((p) => !p.converted)
      .reduce((sum, p) => sum + p.value, 0);

    return { totalIncome, totalExpenses, totalFixed, totalAllExpenses, totalFixedPaid, balance, savings, goal: goal?.target || 0, savingsProgress, totalPending };
  }, [data, selectedMonth]);

  const transactions = useMemo(() => {
    const items: HistoryItem[] = [];

    if (filterType === 'all' || filterType === 'income') {
      data.incomes
        .filter((i) => i.date.startsWith(selectedMonth))
        .forEach((income) => {
          items.push({
            id: income.id,
            type: 'income',
            date: income.date,
            value: income.value,
            category: income.category,
            description: income.description,
            userName: income.userName,
          });
        });
    }

    if (filterType === 'all' || filterType === 'expense') {
      data.expenses
        .filter((e) => e.date.startsWith(selectedMonth))
        .forEach((expense) => {
          items.push({
            id: expense.id,
            type: 'expense',
            date: expense.date,
            value: expense.value,
            category: expense.category,
            description: expense.description,
            userName: expense.userName,
          });
        });
    }

    if (filterType === 'all' || filterType === 'fixed') {
      data.fixedExpenses
        .filter((f) => f.month === selectedMonth && f.isPaid)
        .forEach((fixed) => {
          items.push({
            id: fixed.id,
            type: 'fixed',
            date: fixed.paymentDate || '',
            value: fixed.value,
            category: fixed.name,
            description: `Pago por: ${fixed.paidByUserName}`,
            userName: fixed.paidByUserName,
          });
        });
    }

    if (filterType === 'all' || filterType === 'pending') {
      data.pendingIncomes
        .filter((p) => p.converted && p.expectedDate.startsWith(selectedMonth))
        .forEach((pending) => {
          items.push({
            id: pending.id,
            type: 'pending',
            date: pending.expectedDate,
            value: pending.value,
            category: pending.category,
            description: pending.description,
            userName: pending.userName,
          });
        });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, selectedMonth, filterType]);

  const userExpenses = useMemo(() => {
    const userMap = new Map<string, number>();

    data.expenses
      .filter((e) => e.date.startsWith(selectedMonth))
      .forEach((expense) => {
        if (expense.userName) {
          userMap.set(expense.userName, (userMap.get(expense.userName) || 0) + expense.value);
        }
      });

    return userMap;
  }, [data.expenses, selectedMonth]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Histórico de Movimentações</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Visualize todas as transações com detalhes de quem as realizou
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card
          title="À Receber"
          value={formatCurrency(summary.totalPending)}
          icon={Clock}
          color="blue"
        />
        <Card
          title="Entradas"
          value={formatCurrency(summary.totalIncome)}
          icon={TrendingUp}
          color="emerald"
        />
        <Card
          title="Despesas"
          value={formatCurrency(summary.totalExpenses)}
          icon={TrendingDown}
          color="red"
        />
        <Card
          title="Fixas Pagas"
          value={formatCurrency(summary.totalFixedPaid)}
          icon={Receipt}
          color="amber"
        />
        <Card
          title="Saldo"
          value={formatCurrency(summary.balance)}
          icon={TrendingUp}
          color={summary.balance >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* --- Valores à Receber --- */}
      {data.pendingIncomes.filter((p) => !p.converted).length > 0 && (
        <SimpleCard>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Valores à Receber
          </h3>
          <div className="space-y-3">
            {data.pendingIncomes
              .filter((p) => !p.converted)
              .map((pending) => {
                const today = new Date();
                const expectedDate = new Date(pending.expectedDate);
                const daysUntil = Math.ceil(
                  (expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysUntil < 0;
                const isToday = daysUntil === 0;

                return (
                  <div
                    key={pending.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isOverdue
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : isToday
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          isOverdue
                            ? 'bg-red-100 dark:bg-red-900/50'
                            : isToday
                            ? 'bg-emerald-100 dark:bg-emerald-900/50'
                            : 'bg-blue-100 dark:bg-blue-900/50'
                        }`}
                      >
                        <Clock
                          size={20}
                          className={
                            isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : isToday
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {pending.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isOverdue
                            ? `Atrasado ${Math.abs(daysUntil)} dia(s)`
                            : isToday
                            ? 'Recebimento hoje'
                            : `Previsão em ${daysUntil} dia(s)`}{' '}
                          - {new Date(pending.expectedDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                      {formatCurrency(pending.value)}
                    </p>
                  </div>
                );
              })}
          </div>
        </SimpleCard>
      )}

      {/* --- Transações --- */}
      <SimpleCard>
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Mês
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtro
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas as Movimentações</option>
                <option value="income">Apenas Entradas</option>
                <option value="expense">Apenas Despesas</option>
                <option value="fixed">Apenas Despesas Fixas</option>
                <option value="pending">Apenas À Receber</option>
              </select>
            </div>
          </div>

          {userExpenses.size > 0 && (
            <div className="mb-4 space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Gastos por Usuário (Exclusivo de Despesas Fixas):
              </p>
              {Array.from(userExpenses.entries()).map(([userName, total]) => (
                <div key={userName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {userName}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transações */}
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  item.type === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : item.type === 'expense'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : item.type === 'pending'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`p-2 rounded-lg ${
                        item.type === 'income'
                          ? 'bg-emerald-100 dark:bg-emerald-900/50'
                          : item.type === 'expense'
                          ? 'bg-red-100 dark:bg-red-900/50'
                          : item.type === 'pending'
                          ? 'bg-blue-100 dark:bg-blue-900/50'
                          : 'bg-amber-100 dark:bg-amber-900/50'
                      }`}
                    >
                      {item.type === 'income' ? (
                        <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
                      ) : item.type === 'expense' ? (
                        <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
                      ) : item.type === 'pending' ? (
                        <Clock size={20} className="text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Receipt size={20} className="text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {item.description}
                        </p>
                        <p
                          className={`font-bold ${
                            item.type === 'income' || item.type === 'pending'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {item.type === 'income' || item.type === 'pending' ? '+' : '-'} {formatCurrency(item.value)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span className="capitalize">{item.category}</span>
                        <span>{formatDate(item.date)}</span>
                      </div>
                      {item.userName && (
                        <div className="flex items-center space-x-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                          <User size={12} />
                          <span>Registrado por: {item.userName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Receipt size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma movimentação registrada para {getMonthName(selectedMonth)}
              </p>
            </div>
          )}
        </div>
      </SimpleCard>
    </div>
  );
};
