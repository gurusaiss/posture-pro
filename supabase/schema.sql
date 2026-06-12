-- PosturePro Supabase Schema
-- Run this in Supabase SQL Editor (Database > SQL Editor > New query)

-- 1. Profiles (auto-created on signup via trigger or manual insert)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  created_at timestamptz default now()
);

-- 2. Analysis sessions
create table if not exists analysis_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  session_type text not null check (session_type in ('video', 'webcam')),
  duration_seconds integer default 0,
  total_frames integer default 0,
  frames_with_issues integer default 0,
  avg_confidence_score float default 0,
  dominant_issue text,
  good_posture_pct float default 0,
  ai_recommendation text,
  created_at timestamptz default now()
);

-- 3. Per-frame issue log
create table if not exists posture_issues_log (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references analysis_sessions(id) on delete cascade not null,
  issue_type text not null,
  severity text not null,
  frame_timestamp float default 0,
  confidence float default 0,
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table analysis_sessions enable row level security;
alter table posture_issues_log enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Sessions policies
create policy "Users can view own sessions"
  on analysis_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions"
  on analysis_sessions for insert with check (auth.uid() = user_id);

-- Issues log policies
create policy "Users can view own issue logs"
  on posture_issues_log for select using (
    session_id in (select id from analysis_sessions where user_id = auth.uid())
  );
create policy "Users can insert own issue logs"
  on posture_issues_log for insert with check (
    session_id in (select id from analysis_sessions where user_id = auth.uid())
  );

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
