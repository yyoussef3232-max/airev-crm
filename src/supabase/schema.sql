create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

insert into team_members (name) values
  ('Youssef'), ('Muhammed'), ('Hamid'), ('Christi'), ('Ishaan')
on conflict (name) do nothing;

create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  client text default '',
  contact text default '',
  owner text default '',
  stage text default 'lead' check (stage in ('lead','proposal','negotiation','closing','won','lost')),
  value text default '',
  last_comm text default '',
  last_comm_date date,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on projects
  for each row execute function update_updated_at();

create table if not exists activity_log (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  user_email text,
  action text not null,
  details jsonb default '{}',
  created_at timestamptz default now()
);

alter table team_members enable row level security;
alter table projects enable row level security;
alter table activity_log enable row level security;

create policy "Authenticated users can do everything on team_members"
  on team_members for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can do everything on projects"
  on projects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can do everything on activity_log"
  on activity_log for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table team_members;
```

Commit it. Then create `.env.example` and paste:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
