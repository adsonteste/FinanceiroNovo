/*
  # Sistema de Gestão Financeira - Estrutura Completa

  1. Novas Tabelas
    - `incomes` - Registro de receitas/entradas
      - `id` (uuid, primary key)
      - `value` (decimal) - Valor da receita
      - `date` (date) - Data da receita
      - `category` (text) - Categoria da receita
      - `description` (text) - Descrição
      - `user_id` (text) - ID do usuário (telefone)
      - `user_name` (text) - Nome do usuário que registrou
      - `created_at` (timestamptz) - Data de criação
    
    - `expenses` - Registro de despesas
      - `id` (uuid, primary key)
      - `value` (decimal) - Valor da despesa
      - `date` (date) - Data da despesa
      - `category` (text) - Categoria da despesa
      - `description` (text) - Descrição
      - `user_id` (text) - ID do usuário (telefone)
      - `user_name` (text) - Nome do usuário que registrou
      - `created_at` (timestamptz) - Data de criação
    
    - `fixed_expenses` - Despesas fixas mensais
      - `id` (uuid, primary key)
      - `name` (text) - Nome da despesa fixa
      - `value` (decimal) - Valor mensal
      - `due_day` (integer) - Dia do vencimento (1-31)
      - `month` (text) - Mês de referência (YYYY-MM)
      - `is_paid` (boolean) - Status de pagamento
      - `paid_by_user_id` (text) - ID do usuário que pagou
      - `paid_by_user_name` (text) - Nome do usuário que pagou
      - `payment_date` (date) - Data do pagamento
      - `created_at` (timestamptz) - Data de criação
    
    - `savings_goals` - Metas de economia
      - `id` (uuid, primary key)
      - `month` (text) - Mês de referência (YYYY-MM)
      - `target` (decimal) - Valor da meta
      - `created_at` (timestamptz) - Data de criação
    
    - `pending_incomes` - Receitas a receber
      - `id` (uuid, primary key)
      - `value` (decimal) - Valor a receber
      - `description` (text) - Descrição
      - `category` (text) - Categoria
      - `expected_date` (date) - Data esperada de recebimento
      - `created_date` (date) - Data de criação do registro
      - `user_id` (text) - ID do usuário que registrou
      - `user_name` (text) - Nome do usuário que registrou
      - `converted` (boolean) - Se já foi convertido em receita
      - `created_at` (timestamptz) - Data de criação

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas permissivas para permitir acesso total aos dois usuários autorizados
    
  3. Índices
    - Índices em datas para melhor performance
    - Índices em user_id para filtragem rápida
    
  4. Observações
    - Não há autenticação formal, apenas controle por telefone
    - Ambos usuários têm acesso total a todos os dados
    - Todas as operações registram quem executou
*/

-- Criar tabela de receitas (incomes)
CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value decimal NOT NULL,
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  user_id text,
  user_name text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de despesas (expenses)
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value decimal NOT NULL,
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  user_id text,
  user_name text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de despesas fixas (fixed_expenses)
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  value decimal NOT NULL,
  due_day integer NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  month text NOT NULL,
  is_paid boolean DEFAULT false,
  paid_by_user_id text,
  paid_by_user_name text,
  payment_date date,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de metas de economia (savings_goals)
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  target decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de receitas pendentes (pending_incomes)
CREATE TABLE IF NOT EXISTS pending_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value decimal NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  expected_date date NOT NULL,
  created_date date NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_month ON fixed_expenses(month);
CREATE INDEX IF NOT EXISTS idx_pending_incomes_expected_date ON pending_incomes(expected_date);
CREATE INDEX IF NOT EXISTS idx_pending_incomes_converted ON pending_incomes(converted);

-- Habilitar RLS em todas as tabelas
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_incomes ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas - Todos podem acessar todos os dados
-- Isso permite que os 2 usuários vejam e modifiquem tudo

-- Políticas para incomes
CREATE POLICY "Permitir acesso total a incomes"
  ON incomes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para expenses
CREATE POLICY "Permitir acesso total a expenses"
  ON expenses FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para fixed_expenses
CREATE POLICY "Permitir acesso total a fixed_expenses"
  ON fixed_expenses FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para savings_goals
CREATE POLICY "Permitir acesso total a savings_goals"
  ON savings_goals FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para pending_incomes
CREATE POLICY "Permitir acesso total a pending_incomes"
  ON pending_incomes FOR ALL
  USING (true)
  WITH CHECK (true);