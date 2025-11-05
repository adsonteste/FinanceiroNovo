import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContextSupabase';
import { SimpleCard } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { Zap, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const INCOME_DESCRIPTIONS = [
  'Faxina Galpão',
  'Faxina APTO',
  'Bolsa Família',
  'Entregas Food',
  'Entrega E-commerce',
  'Outros',
];

const EXPENSE_DESCRIPTIONS = [
  'Combustível',
  'Pão',
  'Ifood',
  'Manicure',
  'Cabeleireiro',
  'Outros',
];

export const QuickAdd: React.FC = () => {
  const { addIncome, addExpense, addPendingIncome, currentUser } = useFinance();
  const [quickValue, setQuickValue] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [quickType, setQuickType] = useState<'income' | 'expense' | 'pending' | ''>('');
  const [expectedDate, setExpectedDate] = useState('');

  const handleQuickAdd = async () => {
    const value = parseFloat(quickValue);
    const finalDescription = quickDescription === 'Outros' ? customDescription : quickDescription;

    if (value > 0 && finalDescription.trim() && quickType && currentUser) {
      const payload = {
        value,
        category: 'outros',
        description: finalDescription.trim(),
        userId: currentUser.id,
        userName: currentUser.name,
      };

      try {
        if (quickType === 'pending') {
          if (!expectedDate) {
            alert('Por favor, selecione a data esperada de recebimento');
            return;
          }
          await addPendingIncome({
            ...payload,
            expectedDate,
            createdDate: new Date().toISOString().split('T')[0],
          });
        } else if (quickType === 'income') {
          await addIncome({
            ...payload,
            date: new Date().toISOString().split('T')[0],
          });
        } else {
          await addExpense({
            ...payload,
            date: new Date().toISOString().split('T')[0],
          });
        }

        setQuickValue('');
        setQuickDescription('');
        setCustomDescription('');
        setQuickType('');
        setExpectedDate('');
      } catch (error) {
        console.error('Erro ao adicionar lançamento:', error);
      }
    } else {
      console.warn('Campos obrigatórios ausentes ou usuário nulo.');
    }
  };

  const getDescriptionOptions = () => {
    if (quickType === 'income' || quickType === 'pending') {
      return INCOME_DESCRIPTIONS;
    } else if (quickType === 'expense') {
      return EXPENSE_DESCRIPTIONS;
    }
    return [];
  };

  const getButtonIcon = () => {
    switch (quickType) {
      case 'income':
        return <TrendingUp size={18} className="mr-2" />;
      case 'expense':
        return <TrendingDown size={18} className="mr-2" />;
      case 'pending':
        return <Clock size={18} className="mr-2" />;
      default:
        return null;
    }
  };

  const getButtonText = () => {
    switch (quickType) {
      case 'income':
        return 'Adicionar Entrada';
      case 'expense':
        return 'Adicionar Gasto';
      case 'pending':
        return 'Adicionar à Receber';
      default:
        return 'Selecione o Tipo';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Lançamento Rápido</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Adicione entradas, gastos ou valores a receber rapidamente
        </p>
      </div>

      <SimpleCard className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-lg">
            <Zap size={28} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Novo Lançamento</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Registrado por: {currentUser?.name}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Select
  label="Tipo"
  value={quickType}
  onChange={(value) => {
    setQuickType(value as any);
    setQuickDescription('');
    setCustomDescription('');
    setExpectedDate('');
  }}
  placeholder="Selecione..."
  options={[
    { value: 'pending', label: 'À Receber' },
    { value: 'income', label: 'Entrada' },
    { value: 'expense', label: 'Gasto' },
  ]}
  required
/>

          {quickType && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={quickDescription}
                  onChange={(e) => {
                    setQuickDescription(e.target.value);
                    if (e.target.value !== 'Outros') {
                      setCustomDescription('');
                    }
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {getDescriptionOptions().map((desc) => (
                    <option key={desc} value={desc}>
                      {desc}
                    </option>
                  ))}
                </select>
              </div>

              {quickDescription === 'Outros' && (
                <Input
                  label="Descrição Personalizada"
                  type="text"
                  value={customDescription}
                  onChange={setCustomDescription}
                  placeholder="Digite a descrição..."
                  required
                />
              )}

              <Input
                label="Valor"
                type="number"
                value={quickValue}
                onChange={setQuickValue}
                placeholder="0.00"
                required
                min={0}
                step="0.01"
              />

              {quickType === 'pending' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Esperada de Recebimento
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleQuickAdd}
              className="flex-1 flex items-center justify-center"
              disabled={
                !quickValue ||
                !quickDescription ||
                (quickDescription === 'Outros' && !customDescription.trim()) ||
                !quickType ||
                (quickType === 'pending' && !expectedDate)
              }
            >
              {getButtonIcon()}
              {getButtonText()}
            </Button>
          </div>
        </div>
      </SimpleCard>
    </div>
  );
};
