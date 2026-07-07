-- ============================================================
--  Kracht-tracker — multi-user schema + Row-Level Security
--  Plak dit volledig in de Supabase SQL Editor en klik "Run".
--  Veilig opnieuw te draaien: alles is idempotent (drop-if-exists).
-- ============================================================

-- ---------- Tabellen ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  naam       text,
  rol        text not null default 'gebruiker' check (rol in ('gebruiker','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  naam         text not null,
  spiergroepen text[] not null default '{}',
  type         text not null default 'reps' check (type in ('reps','tijd')),
  doel         numeric,
  favoriet     boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.exercises add column if not exists favoriet boolean not null default false;

create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  datum      date not null,
  oefeningen jsonb not null default '[]',
  start_tijd timestamptz,
  eind_tijd  timestamptz,
  created_at timestamptz not null default now()
);
alter table public.sessions add column if not exists start_tijd timestamptz;
alter table public.sessions add column if not exists eind_tijd  timestamptz;

create table if not exists public.templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  naam         text not null,
  oefening_ids text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists exercises_user_idx on public.exercises(user_id);
create index if not exists sessions_user_idx  on public.sessions(user_id);
create index if not exists templates_user_idx on public.templates(user_id);

-- ---------- Hulpfunctie: is de huidige gebruiker admin? ----------
-- security definer -> draait als eigenaar, omzeilt RLS op profiles (geen recursie).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- ---------- Automatisch profiel aanmaken bij registratie ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, naam)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'naam', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row-Level Security aanzetten ----------
alter table public.profiles  enable row level security;
alter table public.exercises enable row level security;
alter table public.sessions  enable row level security;
alter table public.templates enable row level security;

-- ---------- Policies: profiles ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (public.is_admin());
-- (insert loopt via de trigger met security definer -> geen insert-policy nodig)

-- ---------- Policies: exercises ----------
drop policy if exists exercises_select on public.exercises;
create policy exercises_select on public.exercises
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists exercises_insert on public.exercises;
create policy exercises_insert on public.exercises
  for insert with check (user_id = auth.uid());

drop policy if exists exercises_update on public.exercises;
create policy exercises_update on public.exercises
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists exercises_delete on public.exercises;
create policy exercises_delete on public.exercises
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------- Policies: sessions ----------
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions
  for insert with check (user_id = auth.uid());

drop policy if exists sessions_update on public.sessions;
create policy sessions_update on public.sessions
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists sessions_delete on public.sessions;
create policy sessions_delete on public.sessions
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------- Policies: templates ----------
drop policy if exists templates_select on public.templates;
create policy templates_select on public.templates
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists templates_insert on public.templates;
create policy templates_insert on public.templates
  for insert with check (user_id = auth.uid());

drop policy if exists templates_update on public.templates;
create policy templates_update on public.templates
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists templates_delete on public.templates;
create policy templates_delete on public.templates
  for delete using (user_id = auth.uid() or public.is_admin());

-- Klaar. Controleer: Table Editor toont profiles/exercises/sessions/templates,
-- en bij elke tabel staat "RLS enabled".
