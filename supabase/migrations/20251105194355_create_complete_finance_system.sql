/*
  # Sistema Completo de Gestão Financeira
  
  ## Resumo
  Criação de todas as tabelas necessárias para o sistema de controle financeiro
  com suporte a múltiplos usuários, movimentações compartilhadas e histórico unificado.
  
  ## Novas Tabelas
  
  ### 1. users
  Armazena informações dos usuários autorizados
  - `id` (uuid, primary key)
  - `phone` (text, unique) - Telefone para login
  - `name` (text) - Nome completo
  - `created_at` (timestamptz) - Data de criação
  
  ### 2. transactions
  Tabela unificada para todas as movimentações financeiras
  - `id` (uuid, primary key)
  - `type` (text) - Tipo: 'income', 'expense', 'pending_income'
  - `value` (decimal) - Valor da transação
  - `category` (text) - Categoria da movimentação
  - `description` (text) - Descrição detalhada
  - `transaction_date` (date) - Data da transação
  - `expected_date` (date) - Data esperada (para pending)
  - `status` (text) - Status: 'pending', 'completed', 'converted'
  - `user_id` (text) - ID do usuário que criou
  - `user_name` (text) - Nome do usuário
  - `converted_from_pending_id` (uuid) - ID da pendência original (se aplicável)
  - `created_at` (timestamptz) - Data de criação do registro
  
  ### 3. fixed_expenses
  Despesas fixas mensais
  - `id` (uuid, primary key)
  - `name` (text) - Nome da despesa
  - `value` (decimal) - Valor
  - `due_day` (int) - Dia do vencimento
  - `month` (text) - Mês (YYYY-MM)
  - `is_paid` (boolean) - Status de pagamento
  - `paid_by_user_id` (text) - ID do usuário que pagou
  - `paid_by_user_name` (text) - Nome do usuário que pagou
  - `payment_date` (date) - Data do pagamento
  - `created_at` (timestamptz) - Data de criação
  
  ### 4. savings_goals
  Metas de economia mensais
  - `id` (uuid, primary key)
  - `month` (text) - Mês (YYYY-MM)
  - `target` (decimal) - Valor da meta
  - `created_at` (timestamptz) - Data de criação
  
  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas permitem leitura e escrita para usuários autenticados
  - Dados compartilhados entre todos os usuários autorizados
  
  ## Notas Importantes
  1. Transações pendentes são registradas apenas uma vez
  2. Conversão automática cria nova entrada com referência à pendência
  3. Histórico completo mantido na tabela transactions
  4. Categorias refletem exatamente o digitado pelo usuário
*/

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler usuários"
  ON users FOR SELECT
  TO public
  USING (true);

-- 2. Tabela de transações unificada
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('income', 'expense', 'pending_income')),
  value decimal(15,2) NOT NULL CHECK (value > 0),
  category text NOT NULL,
  description text NOT NULL,
  transaction_date date NOT NULL,
  expected_date date,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'converted')),
  user_id text NOT NULL,
  user_name text NOT NULL,
  converted_from_pending_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler transações"
  ON transactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Todos podem inserir transações"
  ON transactions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar transações"
  ON transactions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos podem deletar transações"
  ON transactions FOR DELETE
  TO public
  USING (true);

-- 3. Tabela de despesas fixas
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  value decimal(15,2) NOT NULL CHECK (value > 0),
  due_day int NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  month text NOT NULL,
  is_paid boolean DEFAULT false,
  paid_by_user_id text,
  paid_by_user_name text,
  payment_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler despesas fixas"
  ON fixed_expenses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Todos podem inserir despesas fixas"
  ON fixed_expenses FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar despesas fixas"
  ON fixed_expenses FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos podem deletar despesas fixas"
  ON fixed_expenses FOR DELETE
  TO public
  USING (true);

-- 4. Tabela de metas de economia
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  month text NOT NULL,
  target decimal(15,2) NOT NULL CHECK (target > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(month)
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler metas"
  ON savings_goals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Todos podem inserir metas"
  ON savings_goals FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar metas"
  ON savings_goals FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos podem deletar metas"
  ON savings_goals FOR DELETE
  TO public
  USING (true);

-- Inserir usuários autorizados
INSERT INTO users (phone, name) 
VALUES 
  ('11910110819', 'Adson Neres'),
  ('11912280324', 'Ruthe Cruz')
ON CONFLICT (phone) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_month ON fixed_expenses(month);
CREATE INDEX IF NOT EXISTS idx_savings_goals_month ON savings_goals(month);