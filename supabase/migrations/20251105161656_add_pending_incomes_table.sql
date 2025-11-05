/*
  # Adicionar tabela de Valores à Receber

  1. Nova Tabela
    - `pending_incomes`
      - `id` (uuid, primary key)
      - `value` (numeric) - Valor a receber
      - `description` (text) - Descrição do valor
      - `category` (text) - Categoria
      - `expected_date` (date) - Data esperada para recebimento
      - `created_date` (date) - Data de criação do registro
      - `user_id` (text) - ID do usuário
      - `user_name` (text) - Nome do usuário
      - `converted` (boolean) - Se já foi convertido em entrada
      - `created_at` (timestamptz) - Timestamp de criação

  2. Security
    - Habilitar RLS na tabela `pending_incomes`
    - Adicionar políticas para usuários autenticados lerem todos os dados
    - Adicionar políticas para inserção, atualização e exclusão
*/

CREATE TABLE IF NOT EXISTS pending_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  expected_date date NOT NULL,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  user_id text NOT NULL,
  user_name text NOT NULL,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pending_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read pending incomes"
  ON pending_incomes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert pending incomes"
  ON pending_incomes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update pending incomes"
  ON pending_incomes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete pending incomes"
  ON pending_incomes
  FOR DELETE
  USING (true);