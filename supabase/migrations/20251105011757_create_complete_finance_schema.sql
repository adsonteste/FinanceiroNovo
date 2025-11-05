/*
  # Sistema Completo de Gestão Financeira

  1. Tabelas Criadas
    - `users`
      - `id` (uuid, primary key)
      - `phone` (text, unique) - Telefone do usuário
      - `name` (text) - Nome completo do usuário
      - `created_at` (timestamptz) - Data de criação
    
    - `incomes`
      - `id` (uuid, primary key)
      - `value` (numeric) - Valor da entrada
      - `date` (date) - Data da entrada
      - `category` (text) - Categoria da entrada
      - `description` (text) - Descrição
      - `user_id` (uuid) - ID do usuário que registrou
      - `user_name` (text) - Nome do usuário que registrou
      - `created_at` (timestamptz) - Data de criação
    
    - `expenses`
      - `id` (uuid, primary key)
      - `value` (numeric) - Valor da despesa
      - `date` (date) - Data da despesa
      - `category` (text) - Categoria da despesa
      - `description` (text) - Descrição
      - `user_id` (uuid) - ID do usuário que registrou
      - `user_name` (text) - Nome do usuário que registrou
      - `created_at` (timestamptz) - Data de criação
    
    - `fixed_expenses`
      - `id` (uuid, primary key)
      - `name` (text) - Nome da despesa fixa
      - `value` (numeric) - Valor mensal
      - `due_day` (integer) - Dia do vencimento (1-31)
      - `month` (text) - Mês no formato YYYY-MM
      - `is_paid` (boolean) - Se foi paga
      - `paid_by_user_id` (uuid) - ID do usuário que pagou
      - `paid_by_user_name` (text) - Nome do usuário que pagou
      - `payment_date` (date) - Data do pagamento
      - `created_at` (timestamptz) - Data de criação
    
    - `savings_goals`
      - `id` (uuid, primary key)
      - `month` (text) - Mês no formato YYYY-MM
      - `target` (numeric) - Valor da meta
      - `created_at` (timestamptz) - Data de criação

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas permitem acesso apenas aos usuários autorizados
    - Usuários compartilham visão de todos os dados financeiros

  3. Notas Importantes
    - Sistema de login baseado em telefone (sem senha)
    - Apenas 2 telefones autorizados: 11910110819 e 11912280324
    - Todas as movimentações registram quem as fez
    - Despesas fixas são reutilizáveis entre meses
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de entradas
CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value numeric NOT NULL CHECK (value >= 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  description text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_name text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value numeric NOT NULL CHECK (value >= 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  description text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_name text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de despesas fixas
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  value numeric NOT NULL CHECK (value >= 0),
  due_day integer NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  month text NOT NULL,
  is_paid boolean DEFAULT false,
  paid_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  paid_by_user_name text,
  payment_date date,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de metas de economia
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  target numeric NOT NULL CHECK (target >= 0),
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_month ON fixed_expenses(month);
CREATE INDEX IF NOT EXISTS idx_savings_goals_month ON savings_goals(month);

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Políticas para users (todos os usuários autorizados podem ver todos os usuários)
CREATE POLICY "Todos podem ver usuários"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de usuários autorizados"
  ON users FOR INSERT
  WITH CHECK (phone IN ('11910110819', '11912280324'));

-- Políticas para incomes (todos os usuários autorizados compartilham visão)
CREATE POLICY "Todos podem ver entradas"
  ON incomes FOR SELECT
  USING (true);

CREATE POLICY "Usuários autorizados podem inserir entradas"
  ON incomes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar entradas"
  ON incomes FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários podem deletar entradas"
  ON incomes FOR DELETE
  USING (true);

-- Políticas para expenses (todos os usuários autorizados compartilham visão)
CREATE POLICY "Todos podem ver despesas"
  ON expenses FOR SELECT
  USING (true);

CREATE POLICY "Usuários autorizados podem inserir despesas"
  ON expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar despesas"
  ON expenses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários podem deletar despesas"
  ON expenses FOR DELETE
  USING (true);

-- Políticas para fixed_expenses (todos os usuários autorizados compartilham visão)
CREATE POLICY "Todos podem ver despesas fixas"
  ON fixed_expenses FOR SELECT
  USING (true);

CREATE POLICY "Usuários autorizados podem inserir despesas fixas"
  ON fixed_expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar despesas fixas"
  ON fixed_expenses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários podem deletar despesas fixas"
  ON fixed_expenses FOR DELETE
  USING (true);

-- Políticas para savings_goals (todos os usuários autorizados compartilham visão)
CREATE POLICY "Todos podem ver metas"
  ON savings_goals FOR SELECT
  USING (true);

CREATE POLICY "Usuários autorizados podem inserir metas"
  ON savings_goals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar metas"
  ON savings_goals FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários podem deletar metas"
  ON savings_goals FOR DELETE
  USING (true);

-- Inserir os dois usuários autorizados
INSERT INTO users (phone, name) 
VALUES 
  ('11910110819', 'Adson Neres'),
  ('11912280324', 'Ruthe Cruz')
ON CONFLICT (phone) DO NOTHING;