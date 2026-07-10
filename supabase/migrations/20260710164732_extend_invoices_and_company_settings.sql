/*
# Extend Invoices + Add Company Settings

## Changes

### invoices table — new columns
- `line_items` (jsonb, default []) — array of {id, description, quantity, unit_price}
- `invoice_date` (date, default current_date) — the issue date shown on the printed invoice
- `include_vat` (boolean, default false) — whether to add 15% VAT to the total
- `notes` (text, nullable) — optional notes printed at the bottom of the invoice

### company_settings table (new)
One row per user. Stores branding and banking details used on printed invoices.
- `id` (uuid, primary key)
- `user_id` (uuid, not null, DEFAULT auth.uid()) — owner
- `company_name` (text)
- `company_tagline` (text, nullable)
- `company_address` (text)
- `company_phone` (text)
- `company_email` (text)
- `bank_name` (text)
- `account_name` (text)
- `account_number` (text)
- `branch_code` (text)
- `logo_data_url` (text, nullable) — base64-encoded logo image
- `created_at` (timestamptz)

## Security
- RLS enabled on company_settings with owner-scoped policies (TO authenticated).
- Invoices columns are additive — no existing data is affected.

## Notes
- Use upsert on company_settings (unique constraint on user_id).
- line_items stored as JSONB so the schema stays flexible.
*/

-- Extend invoices
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='line_items') THEN
    ALTER TABLE invoices ADD COLUMN line_items jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='invoice_date') THEN
    ALTER TABLE invoices ADD COLUMN invoice_date date NOT NULL DEFAULT current_date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='include_vat') THEN
    ALTER TABLE invoices ADD COLUMN include_vat boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='notes') THEN
    ALTER TABLE invoices ADD COLUMN notes text;
  END IF;
END $$;

-- Company settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  company_name text NOT NULL DEFAULT '',
  company_tagline text,
  company_address text NOT NULL DEFAULT '',
  company_phone text NOT NULL DEFAULT '',
  company_email text NOT NULL DEFAULT '',
  bank_name text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  branch_code text NOT NULL DEFAULT '',
  logo_data_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);

DROP POLICY IF EXISTS "select_own_company_settings" ON company_settings;
CREATE POLICY "select_own_company_settings" ON company_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_company_settings" ON company_settings;
CREATE POLICY "insert_own_company_settings" ON company_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_company_settings" ON company_settings;
CREATE POLICY "update_own_company_settings" ON company_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_company_settings" ON company_settings;
CREATE POLICY "delete_own_company_settings" ON company_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
