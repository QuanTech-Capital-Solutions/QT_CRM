/*
# QT CRM — Core Schema

Creates the four main tables for the QuanTech Capital Solutions CRM platform:
clients, projects, invoices, and ledger entries. All tables are owner-scoped
to the authenticated user via user_id with RLS enabled.

## 1. New Tables

### clients
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid() — owner of the client record)
- `company_name` (text, not null)
- `primary_contact` (text, not null)
- `email` (text, not null)
- `phone` (text, nullable)
- `status` (text, not null, default 'Prospect') — one of: Active, Prospect, On Hold
- `notes` (text, nullable)
- `created_at` (timestamptz, default now())

### projects
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid() — owner)
- `name` (text, not null)
- `description` (text, nullable)
- `client_name` (text, not null) — denormalized for display convenience
- `status` (text, not null, default 'Scoping') — one of: Scoping, Active, On Hold, Completed
- `cost_estimate` (numeric, not null, default 0)
- `timeline` (text, nullable)
- `created_at` (timestamptz, default now())

### invoices
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid() — owner)
- `invoice_number` (text, not null)
- `client_name` (text, not null)
- `project_name` (text, nullable)
- `amount` (numeric, not null, default 0)
- `due_date` (date, nullable)
- `status` (text, not null, default 'Draft') — one of: Draft, Sent, Paid, Overdue
- `created_at` (timestamptz, default now())

### ledger_entries
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid() — owner)
- `type` (text, not null) — one of: Income, Expense
- `category` (text, not null)
- `description` (text, nullable)
- `amount` (numeric, not null, default 0)
- `date` (date, not null, default current_date)
- `created_at` (timestamptz, default now())

## 2. Security

- RLS enabled on all four tables.
- Each table has 4 owner-scoped policies (SELECT, INSERT, UPDATE, DELETE) scoped to `authenticated` users where `auth.uid() = user_id`.
- The `user_id` column defaults to `auth.uid()` so inserts that omit it still satisfy the WITH CHECK constraint.

## 3. Indexes

- Index on `user_id` for all tables (frequent filtering by owner).
- Index on `created_at` for ledger_entries and invoices (frequent ordering).

## 4. Important Notes

- This is a multi-user app with sign-in required. Only authenticated users can access their own data.
- No foreign keys to auth.users to keep the schema portable; ownership is enforced via RLS policies.
- client_name and project_name are denormalized on invoices/projects for display — the app does not join across tables.
*/

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  company_name text NOT NULL,
  primary_contact text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'Prospect',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

DROP POLICY IF EXISTS "select_own_clients" ON clients;
CREATE POLICY "select_own_clients" ON clients FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_clients" ON clients;
CREATE POLICY "insert_own_clients" ON clients FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_clients" ON clients;
CREATE POLICY "update_own_clients" ON clients FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_clients" ON clients;
CREATE POLICY "delete_own_clients" ON clients FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  description text,
  client_name text NOT NULL,
  status text NOT NULL DEFAULT 'Scoping',
  cost_estimate numeric NOT NULL DEFAULT 0,
  timeline text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  invoice_number text NOT NULL,
  client_name text NOT NULL,
  project_name text,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'Draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

DROP POLICY IF EXISTS "select_own_invoices" ON invoices;
CREATE POLICY "select_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_invoices" ON invoices;
CREATE POLICY "insert_own_invoices" ON invoices FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_invoices" ON invoices;
CREATE POLICY "update_own_invoices" ON invoices FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_invoices" ON invoices;
CREATE POLICY "delete_own_invoices" ON invoices FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Ledger entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  type text NOT NULL,
  category text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_entries(date DESC);

DROP POLICY IF EXISTS "select_own_ledger" ON ledger_entries;
CREATE POLICY "select_own_ledger" ON ledger_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ledger" ON ledger_entries;
CREATE POLICY "insert_own_ledger" ON ledger_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ledger" ON ledger_entries;
CREATE POLICY "update_own_ledger" ON ledger_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ledger" ON ledger_entries;
CREATE POLICY "delete_own_ledger" ON ledger_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
