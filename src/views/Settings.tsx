import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContextSupabase';
import { SimpleCard } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Trash2, Receipt, Target, CheckCircle, Circle } from 'lucide-react';
import { FixedExpense as FixedExpenseType } from '../types/finance';
import { formatCurrency, getCurrentMonth, getMonthName } from '../utils/calculations';

export const Settings: React.FC = () => {
  const { data, addFixedExpense, updateFixedExpense, deleteFixedExpense, setSavingsGoal, currentUser } =
    useFinance();
  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [fixedFormData, setFixedFormData] = useState({
    name: '',
    category: '',
    customName: '',
    value: '',
    dueDay: '',
  });
  const [goalFormData, setGoalFormData] = useState({
    month: getCurrentMonth(),
    target: '',
  });

  const handleFixedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fixedFormData.category === 'Outros' ? fixedFormData.customName : fixedFormData.category;

    if (editingId) {
      await updateFixedExpense(editingId, {
        name: finalName,
        value: parseFloat(fixedFormData.value),
        dueDay: parseInt(fixedFormData.dueDay),
      });
    } else {
      await addFixedExpense({
        name: finalName,
        value: parseFloat(fixedFormData.value),
        dueDay: parseInt(fixedFormData.dueDay),
        month: selectedMonth,
        isPaid: false,
      });
    }
    resetFixedForm();
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(goalFormData.target);
    if (value > 0) {
      await setSavingsGoal(goalFormData.month, value);
      resetGoalForm();
    }
  };

  const resetFixedForm = () => {
    setFixedFormData({
      name: '',
      category: '',
      customName: '',
      value: '',
      dueDay: '',
    });
    setEditingId(null);
    setIsFixedModalOpen(false);
  };

  const resetGoalForm = () => {
    setGoalFormData({
      month: getCurrentMonth(),
      target: '',
    });
    setIsGoalModalOpen(false);
  };

  const handleEdit = (expense: FixedExpenseType) => {
    const predefinedCategories = ['Aluguel', 'Internet', 'Dentista', 'Cartão De Credito', 'Mercado', 'Parcela Veiculo', 'Emprestimo'];
    const isCustom = !predefinedCategories.includes(expense.name);

    setFixedFormData({
      name: expense.name,
      category: isCustom ? 'Outros' : expense.name,
      customName: isCustom ? expense.name : '',
      value: expense.value.toString(),
      dueDay: expense.dueDay.toString(),
    });
    setEditingId(expense.id);
    setIsFixedModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa fixa?')) {
      deleteFixedExpense(id);
    }
  };

  const togglePaid = (expense: FixedExpenseType) => {
    updateFixedExpense(expense.id, { isPaid: !expense.isPaid });
  };

  const monthExpenses = data.fixedExpenses
    .filter((e) => e.month === selectedMonth)
    .sort((a, b) => a.dueDay - b.dueDay);

  const totalFixed = monthExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const paidTotal = monthExpenses
    .filter((e) => e.isPaid)
    .reduce((sum, expense) => sum + expense.value, 0);

  const currentGoal = data.savingsGoals.find((g) => g.month === getCurrentMonth());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Gerencie suas despesas fixas e metas de economia
        </p>
      </div>

      <SimpleCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Meta de Economia</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentGoal
                ? `Meta atual: ${formatCurrency(currentGoal.target)}`
                : 'Nenhuma meta definida para o mês atual'}
            </p>
          </div>
          <Button onClick={() => setIsGoalModalOpen(true)} size="sm">
            <Target size={16} className="inline mr-2" />
            {currentGoal ? 'Editar Meta' : 'Definir Meta'}
          </Button>
        </div>
      </SimpleCard>

      <SimpleCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Despesas Fixas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total: {formatCurrency(totalFixed)} | Pago: {formatCurrency(paidTotal)}
            </p>
          </div>
          <Button onClick={() => setIsFixedModalOpen(true)} size="sm">
            <Plus size={16} className="inline mr-2" />
            Nova Despesa
          </Button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecionar Mês
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {monthExpenses.length > 0 ? (
          <div className="space-y-3">
            {monthExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  expense.isPaid
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <button
                    onClick={() => togglePaid(expense)}
                    className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {expense.isPaid ? (
                      <CheckCircle
                        size={24}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    ) : (
                      <Circle size={24} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Receipt size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        expense.isPaid
                          ? 'text-emerald-900 dark:text-emerald-100'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {expense.name}
                    </p>
                    <p
                      className={`text-sm ${
                        expense.isPaid
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {formatCurrency(expense.value)} - Vencimento dia {expense.dueDay}
                      {expense.isPaid && expense.paidByUserName && (
                        <span className="ml-2">Pago por: {expense.paidByUserName}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg text-gray-600 dark:text-gray-300"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma despesa fixa registrada para {getMonthName(selectedMonth)}
            </p>
            <Button onClick={() => setIsFixedModalOpen(true)} className="mt-4" size="sm">
              Adicionar Primeira Despesa
            </Button>
          </div>
        )}
      </SimpleCard>

      <Modal
        isOpen={isFixedModalOpen}
        onClose={resetFixedForm}
        title={editingId ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
      >
        <form onSubmit={handleFixedSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={fixedFormData.category}
              onChange={(e) => setFixedFormData({ ...fixedFormData, category: e.target.value, customName: '' })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecione...</option>
              <option value="Aluguel">Aluguel</option>
              <option value="Internet">Internet</option>
              <option value="Dentista">Dentista</option>
              <option value="Cartão De Credito">Cartão De Credito</option>
              <option value="Mercado">Mercado</option>
              <option value="Parcela Veiculo">Parcela Veiculo</option>
              <option value="Emprestimo">Emprestimo</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          {fixedFormData.category === 'Outros' && (
            <Input
              label="Nome da Despesa"
              type="text"
              value={fixedFormData.customName}
              onChange={(value) => setFixedFormData({ ...fixedFormData, customName: value })}
              placeholder="Digite o nome da despesa..."
              required
            />
          )}
          <Input
            label="Valor Mensal"
            type="number"
            value={fixedFormData.value}
            onChange={(value) => setFixedFormData({ ...fixedFormData, value })}
            placeholder="0.00"
            required
            min={0}
            step="0.01"
          />
          <Input
            label="Dia do Vencimento"
            type="number"
            value={fixedFormData.dueDay}
            onChange={(value) => setFixedFormData({ ...fixedFormData, dueDay: value })}
            placeholder="1-31"
            required
            min={1}
          />
          <div className="flex space-x-3 mt-6">
            <Button type="submit" className="flex-1">
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetFixedForm}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={resetGoalForm} title="Definir Meta de Economia">
        <form onSubmit={handleGoalSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mês
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="month"
              value={goalFormData.month}
              onChange={(e) => setGoalFormData({ ...goalFormData, month: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <Input
            label="Valor da Meta"
            type="number"
            value={goalFormData.target}
            onChange={(value) => setGoalFormData({ ...goalFormData, target: value })}
            placeholder="0.00"
            required
            min={0}
            step="0.01"
          />
          <div className="flex space-x-3 mt-6">
            <Button type="submit" className="flex-1">
              Salvar Meta
            </Button>
            <Button type="button" variant="secondary" onClick={resetGoalForm}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
