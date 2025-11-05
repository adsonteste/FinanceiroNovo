import { useEffect } from 'react';
import { useFinance } from '../context/FinanceContextSupabase';
import {
  getCurrentMonth,
  calculateSavings,
  calculateSavingsProgress,
  getExpensesByCategory,
  getWeeklyAverage,
  calculateTotalExpenses,
} from '../utils/calculations';

export const useSmartAlerts = () => {
  const { data, addNotification } = useFinance();

  useEffect(() => {
    const checkAlerts = () => {
      const currentMonth = getCurrentMonth();

      const goal = data.savingsGoals.find((g) => g.month === currentMonth);
      if (goal) {
        const savings = calculateSavings(
          data.incomes,
          data.expenses,
          data.fixedExpenses,
          currentMonth
        );
        const progress = calculateSavingsProgress(savings, goal.target);

        if (progress >= 80 && progress < 100) {
          const lastAlert = localStorage.getItem('last_alert_80');
          if (lastAlert !== currentMonth) {
            addNotification({
              type: 'success',
              message: `Você atingiu 80% da sua meta de economia! Faltam apenas ${(
                goal.target - savings
              ).toFixed(2)} para alcançar seu objetivo.`,
            });
            localStorage.setItem('last_alert_80', currentMonth);
          }
        }

        if (progress >= 100) {
          const lastAlert = localStorage.getItem('last_alert_100');
          if (lastAlert !== currentMonth) {
            addNotification({
              type: 'success',
              message: 'Parabéns! Você atingiu sua meta de economia deste mês!',
            });
            localStorage.setItem('last_alert_100', currentMonth);
          }
        }
      }

      const categoryExpenses = getExpensesByCategory(data.expenses, currentMonth);
      const totalMonthExpenses = calculateTotalExpenses(data.expenses, currentMonth);

      Object.entries(categoryExpenses).forEach(([category, value]) => {
        const percentage = (value / totalMonthExpenses) * 100;
        if (percentage > 40) {
          const lastAlert = localStorage.getItem(`last_alert_category_${category}`);
          if (lastAlert !== currentMonth) {
            addNotification({
              type: 'warning',
              message: `Atenção! Você gastou ${percentage.toFixed(
                0
              )}% do seu orçamento em ${category} este mês.`,
            });
            localStorage.setItem(`last_alert_category_${category}`, currentMonth);
          }
        }
      });

      const weeklyAvg = getWeeklyAverage(data.expenses, 4);
      const lastWeekExpenses = data.expenses.filter((e) => {
        const date = new Date(e.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      });
      const lastWeekTotal = lastWeekExpenses.reduce((sum, e) => sum + e.value, 0);

      if (lastWeekTotal > weeklyAvg * 1.5) {
        const lastAlert = localStorage.getItem('last_alert_weekly');
        const today = new Date().toISOString().split('T')[0];
        if (lastAlert !== today) {
          addNotification({
            type: 'warning',
            message: `Você gastou 50% acima da sua média semanal esta semana. Cuidado com o orçamento!`,
          });
          localStorage.setItem('last_alert_weekly', today);
        }
      }

      const today = new Date().getDate();
      const todayStr = new Date().toISOString().split('T')[0];

      const upcomingFixedExpenses = data.fixedExpenses.filter(
        (fe) => fe.month === currentMonth && !fe.isPaid
      );

      upcomingFixedExpenses.forEach((fe) => {
        const daysUntilDue = fe.dueDay - today;

        if (daysUntilDue <= 5 && daysUntilDue >= 0) {
          const lastAlert = localStorage.getItem(`last_alert_due_${fe.id}`);
          if (lastAlert !== todayStr) {
            const daysText = daysUntilDue === 0 ? 'hoje' : daysUntilDue === 1 ? 'amanhã' : `em ${daysUntilDue} dias`;
            addNotification({
              type: 'warning',
              message: `ATENÇÃO: ${fe.name} vence ${daysText}! Valor: R$ ${fe.value.toFixed(2)}`,
            });
            localStorage.setItem(`last_alert_due_${fe.id}`, todayStr);
          }
        }

        if (daysUntilDue < 0) {
          const lastAlert = localStorage.getItem(`last_alert_overdue_${fe.id}`);
          if (lastAlert !== todayStr) {
            addNotification({
              type: 'warning',
              message: `VENCIDO: ${fe.name} venceu há ${Math.abs(daysUntilDue)} dia(s)! Valor: R$ ${fe.value.toFixed(2)}. Marque como pago nas Configurações.`,
            });
            localStorage.setItem(`last_alert_overdue_${fe.id}`, todayStr);
          }
        }
      });
    };

    checkAlerts();
  }, [data, addNotification]);
};
