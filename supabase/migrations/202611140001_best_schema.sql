-- BEST fitness app: user-owned data. Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  source text not null check (source in ('AI', 'สร้างเอง', 'สำเร็จรูป')),
  goal text not null default 'สร้างกล้ามเนื้อ',
  duration_weeks integer check (duration_weeks between 1 and 52),
  training_days text[] not null default '{}',
  minutes_per_session integer check (minutes_per_session in (30, 60, 90, 120)),
  target_weight_kg numeric(6,2) check (target_weight_kg > 0),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text not null default 'อก',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  constraint program_exercises_owner_fk foreign key (program_id, user_id) references public.programs(id, user_id) on delete cascade
);

create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.program_exercises(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null,
  weight_kg numeric(7,2) not null default 0 check (weight_kg >= 0),
  reps integer not null default 8 check (reps > 0),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (exercise_id, position),
  constraint exercise_sets_owner_fk foreign key (exercise_id, user_id) references public.program_exercises(id, user_id) on delete cascade
);

create table if not exists public.body_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_on date not null default current_date,
  weight_kg numeric(6,2) not null check (weight_kg > 0),
  height_cm numeric(6,2) not null check (height_cm > 0),
  muscle_mass_kg numeric(6,2) not null check (muscle_mass_kg >= 0),
  body_fat_pct numeric(5,2) not null check (body_fat_pct between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  style text not null,
  calories integer not null check (calories > 0),
  protein_g numeric(7,2) not null check (protein_g >= 0),
  carbs_g numeric(7,2) not null check (carbs_g >= 0),
  fat_g numeric(7,2) not null check (fat_g >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0)
);

create index if not exists programs_user_created_idx on public.programs(user_id, created_at desc);
create index if not exists body_records_user_date_idx on public.body_records(user_id, recorded_on desc);
create index if not exists nutrition_plans_user_created_idx on public.nutrition_plans(user_id, created_at desc);
create index if not exists workout_sessions_user_started_idx on public.workout_sessions(user_id, started_at desc);

alter table public.programs enable row level security;
alter table public.program_exercises enable row level security;
alter table public.exercise_sets enable row level security;
alter table public.body_records enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.workout_sessions enable row level security;

create policy "Users manage own programs" on public.programs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own program exercises" on public.program_exercises for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own exercise sets" on public.exercise_sets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own body records" on public.body_records for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own nutrition plans" on public.nutrition_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own workout sessions" on public.workout_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
