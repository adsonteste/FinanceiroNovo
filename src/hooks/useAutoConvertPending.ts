import { useEffect } from 'react';
import { useFinance } from '../context/FinanceContextSupabase';

export const useAutoConvertPending = () => {
  const { data, convertPendingToIncome } = useFinance();

  useEffect(() => {
    const checkAndConvert = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingToConvert = data.pendingIncomes.filter((pending) => {
        if (pending.converted) return false;

        const expectedDate = new Date(pending.expectedDate);
        expectedDate.setHours(0, 0, 0, 0);

        return expectedDate <= today;
      });

      for (const pending of pendingToConvert) {
        try {
          await convertPendingToIncome(pending.id);
        } catch (error) {
          console.error('Erro ao converter valor pendente:', error);
        }
      }
    };

    if (data.pendingIncomes.length > 0) {
      checkAndConvert();
    }
  }, [data.pendingIncomes, convertPendingToIncome]);
};
