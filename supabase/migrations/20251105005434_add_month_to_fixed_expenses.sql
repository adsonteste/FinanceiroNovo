/*
  # Add month field to fixed_expenses

  Update fixed_expenses table to include month field for proper monthly tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fixed_expenses' AND column_name = 'month'
  ) THEN
    ALTER TABLE fixed_expenses ADD COLUMN month text;
  END IF;
END $$;
