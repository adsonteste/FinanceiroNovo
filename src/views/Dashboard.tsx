import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContextSupabase';
import { Card, SimpleCard } from '../components/Card';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  Clock,
} from 'lucide-react';
import {
  getCurrentMonth,
  getMonthName,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalFixedExpenses,
  calculateSavings,
  getExpensesByCategory,
  formatCurrency,
} from '../utils/calculations';

export const Dashboard: React.FC = () => {
  const { data, currentUser } = useFinance();
  const currentMonth = getCurrentMonth();

  // Cálculos principais
  const monthlyData = useMemo(() => {
    const totalIncome = calculateTotalIncome(data.incomes, currentMonth);
    const totalExpenses = calculateTotalExpenses(data.expenses, currentMonth);
    const totalFixed = data.fixedExpenses
      .filter((f) => f.month === currentMonth)
      .reduce((sum, f) => sum + f.value, 0);
    const totalFixedPaid = data.fixedExpenses
      .filter((f) => f.month === currentMonth && f.isPaid)
      .reduce((sum, f) => sum + f.value, 0);
    const totalAllExpenses = totalExpenses + totalFixedPaid;
    const savings = calculateSavings(
      data.incomes,
      data.expenses,
      data.fixedExpenses,
      currentMonth
    );
    const available = totalIncome - totalExpenses - totalFixedPaid;

    return {
      totalIncome,
      totalExpenses,
      totalFixed,
      totalAllExpenses,
      totalFixedPaid,
      savings,
      available,
    };
  }, [data, currentMonth]);

  // Cálculo do "À Receber" — somatório de receitas pendentes
  const monthlyPendingIncome = useMemo(() => {
    return data.pendingIncomes
      .filter((p) => !p.converted)
      .reduce((sum, p) => sum + p.value, 0);
  }, [data.pendingIncomes]);

  // Meta de economia
  const savingsData = useMemo(() => {
    const goal = data.savingsGoals.find((g) => g.month === currentMonth);
    if (!goal) return null;

    const progress = (monthlyData.savings / goal.target) * 100;
    let color = 'red';
    let bgColor = 'bg-red-50 dark:bg-red-900/20';
    let borderColor = 'border-red-200 dark:border-red-800';
    let barColor = 'bg-red-600 dark:bg-red-500';

    if (progress >= 99) {
      color = 'emerald';
      bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
      borderColor = 'border-emerald-200 dark:border-emerald-800';
      barColor = 'bg-emerald-600 dark:bg-emerald-500';
    } else if (progress >= 71) {
      color = 'amber';
      bgColor = 'bg-amber-50 dark:bg-amber-900/20';
      borderColor = 'border-amber-200 dark:border-amber-800';
      barColor = 'bg-amber-600 dark:bg-amber-500';
    }

    return { goal: goal.target, progress, color, bgColor, borderColor, barColor };
  }, [data.savingsGoals, monthlyData.savings, currentMonth]);

  // Top 5 categorias de gastos
  const categoryData = useMemo(() => {
    const categories = getExpensesByCategory(data.expenses, currentMonth);
    const sorted = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    return sorted;
  }, [data.expenses, currentMonth]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Controle Financeiro
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {getMonthName(currentMonth)}
          </p>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card
          title="À Receber"
          value={formatCurrency(monthlyPendingIncome)}
          icon={Clock}
          color="blue"
        />
        <Card
          title="Entradas Totais"
          value={formatCurrency(monthlyData.totalIncome)}
          icon={TrendingUp}
          color="emerald"
        />
        <Card
          title="Gastos Totais"
          value={formatCurrency(monthlyData.totalAllExpenses)}
          icon={TrendingDown}
          color="red"
        />
        <Card
          title="Despesas Fixas"
          value={formatCurrency(monthlyData.totalFixed)}
          icon={Receipt}
          color="amber"
        />
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Saldo Disponível
              </p>
              <p
                className={`text-2xl font-bold ${
                  monthlyData.available >= 0
                    ? 'text-gray-900 dark:text-white'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(monthlyData.available)}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                monthlyData.available >= 0
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}
            >
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>

      {savingsData && (
        <SimpleCard className={`border ${savingsData.borderColor} ${savingsData.bgColor}`}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Meta de Economia
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Economizado
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {formatCurrency(monthlyData.savings)} de {formatCurrency(savingsData.goal)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`${savingsData.barColor} h-3 rounded-full transition-all`}
                style={{ width: `${Math.min(savingsData.progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Progresso
              </span>
              <span className={`text-sm font-bold ${
                savingsData.progress >= 99 ? 'text-emerald-600 dark:text-emerald-400' :
                savingsData.progress >= 71 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {savingsData.progress.toFixed(1)}%
              </span>
            </div>
          </div>
        </SimpleCard>
      )}

      {/* Categorias de gastos */}
      <SimpleCard>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Top 5 Categorias de Gastos
        </h3>
        <div className="space-y-3">
          {categoryData.length > 0 ? (
            categoryData.map(([category, value]) => {
              const percentage =
                (value / (monthlyData.totalExpenses || 1)) * 100;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhum gasto registrado neste mês
            </p>
          )}
        </div>
      </SimpleCard>
    </div>
  );
};
