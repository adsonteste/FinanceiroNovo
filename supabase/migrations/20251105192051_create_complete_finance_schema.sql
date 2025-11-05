/*
  # Sistema de Gestão Financeira Pessoal - Schema Completo

  ## Descrição
  Sistema completo de controle financeiro com suporte a múltiplos usuários,
  receitas, despesas, despesas fixas, metas de economia e valores a receber.

  ## Novas Tabelas

  ### 1. incomes (Receitas/Entradas)
  - `id` (uuid, primary key) - Identificador único
  - `value` (decimal) - Valor da entrada
  - `date` (date) - Data da entrada
  - `category` (text) - Categoria da entrada
  - `description` (text) - Descrição da entrada
  - `user_id` (text) - ID do usuário que registrou
  - `user_name` (text) - Nome do usuário que registrou
  - `created_at` (timestamptz) - Data de criação do registro

  ### 2. expenses (Despesas/Gastos)
  - `id` (uuid, primary key) - Identificador único
  - `value` (decimal) - Valor da despesa
  - `date` (date) - Data da despesa
  - `category` (text) - Categoria da despesa
  - `description` (text) - Descrição da despesa
  - `user_id` (text) - ID do usuário que registrou
  - `user_name` (text) - Nome do usuário que registrou
  - `created_at` (timestamptz) - Data de criação do registro

  ### 3. fixed_expenses (Despesas Fixas)
  - `id` (uuid, primary key) - Identificador único
  - `name` (text) - Nome da despesa fixa
  - `value` (decimal) - Valor da despesa
  - `due_day` (integer) - Dia do vencimento (1-31)
  - `month` (text) - Mês de referência (YYYY-MM)
  - `is_paid` (boolean) - Status de pagamento
  - `paid_by_user_id` (text) - ID do usuário que pagou
  - `paid_by_user_name` (text) - Nome do usuário que pagou
  - `payment_date` (date) - Data do pagamento
  - `created_at` (timestamptz) - Data de criação do registro

  ### 4. savings_goals (Metas de Economia)
  - `id` (uuid, primary key) - Identificador único
  - `month` (text) - Mês de referência (YYYY-MM)
  - `target` (decimal) - Valor da meta
  - `created_at` (timestamptz) - Data de criação do registro

  ### 5. pending_incomes (Valores a Receber)
  - `id` (uuid, primary key) - Identificador único
  - `value` (decimal) - Valor a receber
  - `description` (text) - Descrição
  - `category` (text) - Categoria
  - `expected_date` (date) - Data esperada de recebimento
  - `created_date` (date) - Data de criação
  - `user_id` (text) - ID do usuário que registrou
  - `user_name` (text) - Nome do usuário que registrou
  - `converted` (boolean) - Se já foi convertido para income
  - `created_at` (timestamptz) - Data de criação do registro

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas públicas para leitura e escrita (sistema compartilhado entre 2 usuários)
  - Todos os dados são visíveis para ambos os usuários autorizados

  ## Índices
  - Índices em datas para otimizar consultas por período
  - Índices em campos de relacionamento e filtros comuns
*/

-- Criar tabela de receitas/entradas
CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value decimal(10, 2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'outros',
  description text NOT NULL,
  user_id text,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de despesas/gastos
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value decimal(10, 2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'outros',
  description text NOT NULL,
  user_id text,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de despesas fixas
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  value decimal(10, 2) NOT NULL DEFAULT 0,
  due_day integer NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  month text NOT NULL,
  is_paid boolean DEFAULT false,
  paid_by_user_id text,
  paid_by_user_name text,
  payment_date date,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de metas de economia
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  target decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de valores a receber
CREATE TABLE IF NOT EXISTS pending_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value decimal(10, 2) NOT NULL DEFAULT 0,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  expected_date date NOT NULL,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  user_id text NOT NULL,
  user_name text NOT NULL,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date DESC);
CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_month ON fixed_expenses(month);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_is_paid ON fixed_expenses(is_paid);
CREATE INDEX IF NOT EXISTS idx_pending_incomes_expected_date ON pending_incomes(expected_date);
CREATE INDEX IF NOT EXISTS idx_pending_incomes_converted ON pending_incomes(converted);

-- Habilitar RLS em todas as tabelas
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_incomes ENABLE ROW LEVEL SECURITY;

-- Políticas para incomes (acesso público para os 2 usuários)
CREATE POLICY "Allow all access to incomes"
  ON incomes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para expenses (acesso público para os 2 usuários)
CREATE POLICY "Allow all access to expenses"
  ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para fixed_expenses (acesso público para os 2 usuários)
CREATE POLICY "Allow all access to fixed_expenses"
  ON fixed_expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para savings_goals (acesso público para os 2 usuários)
CREATE POLICY "Allow all access to savings_goals"
  ON savings_goals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para pending_incomes (acesso público para os 2 usuários)
CREATE POLICY "Allow all access to pending_incomes"
  ON pending_incomes
  FOR ALL
  USING (true)
  WITH CHECK (true);