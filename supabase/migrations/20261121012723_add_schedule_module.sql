/*
# Project Management & Calendar Scheduling Module

Adds project checklist/task tracking and calendar scheduling to the CRM.

## 1. New Columns

### projects
- `deadline` (date, nullable) — optional project due date used to plot
  deadlines on the calendar. Kept separate from the free-text `timeline`
  column so existing data is untouched.

## 2. Status Value Migration (projects.status)

The manual project status badge set changes from
{Scoping, Active, On Hold, Completed} to
{Not Started, In Progress, Review, Completed}.
Existing rows are remapped in place:
  Scoping   -> Not Started
  Active    -> In Progress
  On Hold   -> In Progress
  Completed -> Completed
The column type stays `text` (no CHECK constraint) so the new values are
accepted without a type change. No data is lost.

## 3. New Tables

### project_tasks
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid() — owner)
- `project_id` (uuid, not null, references projects(id) ON DELETE CASCADE)
- `title` (text, not null)
- `description` (text, nullable)
- `due_date` (date, nullable)
- `priority` (text, not null, default 'Medium') — one of: Low, Medium, High
- `is_completed` (boolean, not null, default false)
- `sort_order` (integer, not null, default 0)
- `created_at` (timestamptz, default now())
A checklist of action steps belonging to a project. Completion progress is
computed in the app as completed/total.

### calendar_events
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid() — owner)
- `title` (text, not null)
- `description` (text, nullable)
- `event_type` (text, not null, default 'custom') — one of: meeting, task, deadline, custom
- `start_date` (date, not null) — the calendar day the event belongs to
- `start_time` (time, nullable) — optional time-of-day for time-blocked items
- `end_time` (time, nullable) — optional end time
- `all_day` (boolean, not null, default true)
- `client_name` (text, nullable) — linked client (denormalized for display)
- `project_id` (uuid, nullable, references projects(id) ON DELETE SET NULL)
- `task_id` (uuid, nullable, references project_tasks(id) ON DELETE SET NULL)
- `color` (text, nullable) — optional override color
- `is_completed` (boolean, not null, default false) — lets tasks be checked off from the calendar
- `created_at` (timestamptz, default now())
Stores manually scheduled meetings, time-blocked tasks, and reminders. Project
deadlines and task due dates are plotted on the calendar dynamically from
their source tables, so they are NOT duplicated here.

## 4. Security

- RLS enabled on both new tables.
- Owner-scoped CRUD policies (SELECT/INSERT/UPDATE/DELETE) scoped to
  `authenticated` where `auth.uid() = user_id`, matching the existing
  multi-user pattern.
- `user_id` columns default to `auth.uid()` so inserts that omit the owner
  still satisfy the WITH CHECK constraint.
- Grants: SELECT, INSERT, UPDATE, DELETE on both tables TO authenticated.

## 5. Indexes

- project_tasks: user_id, project_id, due_date
- calendar_events: user_id, start_date

## 6. Important Notes

- This is a multi-user app with sign-in required. Only authenticated users
  can access their own data.
- Child tables reference projects via foreign key with CASCADE/SET NULL so
  deleting a project cleans up its tasks and nulls calendar event links.
- No destructive column drops or type changes.
*/

-- Add optional deadline column to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE projects ADD COLUMN deadline date;
  END IF;
END $$;

-- Remap existing project statuses to the new badge set
UPDATE projects SET status = 'Not Started'  WHERE status = 'Scoping';
UPDATE projects SET status = 'In Progress'  WHERE status = 'Active';
UPDATE projects SET status = 'In Progress'  WHERE status = 'On Hold';
-- 'Completed' stays 'Completed'

-- project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  priority text NOT NULL DEFAULT 'Medium',
  is_completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_project_tasks_user_id ON project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON project_tasks TO authenticated;

DROP POLICY IF EXISTS "select_own_project_tasks" ON project_tasks;
CREATE POLICY "select_own_project_tasks" ON project_tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_project_tasks" ON project_tasks;
CREATE POLICY "insert_own_project_tasks" ON project_tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_project_tasks" ON project_tasks;
CREATE POLICY "update_own_project_tasks" ON project_tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_project_tasks" ON project_tasks;
CREATE POLICY "delete_own_project_tasks" ON project_tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'custom',
  start_date date NOT NULL DEFAULT current_date,
  start_time time,
  end_time time,
  all_day boolean NOT NULL DEFAULT true,
  client_name text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES project_tasks(id) ON DELETE SET NULL,
  color text,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO authenticated;

DROP POLICY IF EXISTS "select_own_calendar_events" ON calendar_events;
CREATE POLICY "select_own_calendar_events" ON calendar_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_calendar_events" ON calendar_events;
CREATE POLICY "insert_own_calendar_events" ON calendar_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_calendar_events" ON calendar_events;
CREATE POLICY "update_own_calendar_events" ON calendar_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_calendar_events" ON calendar_events;
CREATE POLICY "delete_own_calendar_events" ON calendar_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
