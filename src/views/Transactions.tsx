import React from 'react';
import { useFinance } from '../context/FinanceContextSupabase';
import { SimpleCard } from '../components/Card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

export const Transactions: React.FC = () => {
  const { data } = useFinance();

  const allTransactions = [
    ...data.incomes.map(i => ({ ...i, type: 'income' as const })),
    ...data.expenses.map(e => ({ ...e, type: 'expense' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Transações</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Histórico completo de todas as transações
        </p>
      </div>

      <SimpleCard>
        <div className="space-y-3">
          {allTransactions.length > 0 ? (
            allTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  transaction.type === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      transaction.type === 'income'
                        ? 'bg-emerald-100 dark:bg-emerald-900/50'
                        : 'bg-red-100 dark:bg-red-900/50'
                    }`}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUp size={20} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowDown size={20} className="text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{transaction.category}</span>
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                    {transaction.userName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Por: {transaction.userName}
                      </p>
                    )}
                  </div>
                </div>
                <p
                  className={`font-bold text-lg ${
                    transaction.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.value)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhuma transação registrada
            </p>
          )}
        </div>
      </SimpleCard>
    </div>
  );
};
