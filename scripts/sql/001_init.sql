-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- Profiles (HRMS-lite)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  college_uid text,
  year text,
  dept text,
  skills text[],
  team_role text, -- Maintenance, Media, Management, Fabrication, Technical, Design
  role text not null default 'member', -- admin | member | faculty
  created_at timestamptz not null default now()
);

-- Payments
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null check (amount >= 0),
  mode text not null check (mode in ('online', 'cash')),
  transaction_id text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Expenses
create table if not exists expense_categories (
  id serial primary key,
  name text unique not null
);

insert into expense_categories(name) values
  ('Robot Parts'), ('Competition Registration'), ('Travel & Accommodation'), ('Tools/Workshop Costs')
on conflict do nothing;

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  category_id int references expense_categories(id),
  description text,
  amount integer not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','approved')),
  approved_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Competitions
create table if not exists competitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rules text,
  fee integer,
  status text not null default 'active' check (status in ('active','archived')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

-- Teams
create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  competition_id uuid references competitions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  member_role text,
  primary key (team_id, user_id)
);

-- Bots / Assets
create table if not exists bots (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text,
  owner_id uuid references profiles(id),
  assigned_team uuid references teams(id),
  created_at timestamptz not null default now()
);

create table if not exists maintenance_logs (
  id uuid primary key default uuid_generate_v4(),
  bot_id uuid references bots(id) on delete cascade,
  note text,
  cost integer default 0,
  created_at timestamptz not null default now()
);

-- Inventory
create table if not exists inventory_parts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text,
  quantity integer not null default 0,
  unit text,
  created_at timestamptz not null default now()
);
