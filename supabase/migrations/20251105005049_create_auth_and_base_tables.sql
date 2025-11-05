/*
  # Create base tables for Finance Control System

  1. New Tables
    - `users` - Store authorized users
      - `id` (uuid, primary key)
      - `phone` (text, unique) - Phone number
      - `name` (text) - User name
      - `created_at` (timestamp)
    
    - `incomes` - Store income records
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `value` (numeric)
      - `category` (text)
      - `description` (text)
      - `date` (date)
      - `created_at` (timestamp)
    
    - `expenses` - Store expense records
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `value` (numeric)
      - `category` (text)
      - `description` (text)
      - `date` (date)
      - `created_at` (timestamp)
    
    - `fixed_expenses` - Store recurring expenses
      - `id` (uuid, primary key)
      - `name` (text)
      - `value` (numeric)
      - `due_day` (integer)
      - `is_paid` (boolean)
      - `paid_by_user_id` (uuid, nullable, who paid this expense)
      - `payment_date` (date, nullable)
      - `created_at` (timestamp)
    
    - `savings_goals` - Store savings goals
      - `id` (uuid, primary key)
      - `month` (text)
      - `target` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value numeric NOT NULL DEFAULT 0,
  category text NOT NULL,
  description text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value numeric NOT NULL DEFAULT 0,
  category text NOT NULL,
  description text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  due_day integer NOT NULL,
  is_paid boolean DEFAULT false,
  paid_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  payment_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  target numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view all data"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "All users can view all incomes"
  ON incomes FOR SELECT
  USING (true);

CREATE POLICY "All users can view all expenses"
  ON expenses FOR SELECT
  USING (true);

CREATE POLICY "All users can view all fixed expenses"
  ON fixed_expenses FOR SELECT
  USING (true);

CREATE POLICY "All users can view all savings goals"
  ON savings_goals FOR SELECT
  USING (true);

CREATE POLICY "Users can create incomes"
  ON incomes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can create fixed expenses"
  ON fixed_expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update fixed expenses"
  ON fixed_expenses FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Users can create savings goals"
  ON savings_goals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update savings goals"
  ON savings_goals FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Users can delete fixed expenses"
  ON fixed_expenses FOR DELETE
  USING (true);

INSERT INTO users (phone, name) VALUES
  ('11910110819', 'Adson Neres'),
  ('11912280324', 'Ruthe Cruz')
ON CONFLICT DO NOTHING;
