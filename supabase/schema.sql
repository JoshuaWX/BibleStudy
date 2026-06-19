-- RUC Chapel of Power Bible Study Department member records.
-- Apply in the Supabase SQL Editor for the project in .env:
-- https://tlnpkkdayelusrrjspzo.supabase.co

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  surname text not null check (char_length(trim(surname)) between 2 and 80),
  other_names text not null check (char_length(trim(other_names)) between 2 and 120),
  department text not null check (char_length(trim(department)) between 2 and 120),
  level text not null check (level in ('100 level', '200 level', '300 level', '400 level', '500 level')),
  bible_study_unit text not null check (
    bible_study_unit in (
      'Prayer unit',
      'Compliance unit',
      'Welfare unit',
      'Outline-Collation unit',
      'not interested'
    )
  ),
  phone_number text not null check (char_length(trim(phone_number)) between 7 and 30),
  phone_number_key text not null check (phone_number_key ~ '^\+[0-9]{7,15}$'),
  birthday date not null check (birthday <= current_date),
  gender text not null check (gender in ('Male', 'Female')),
  matric_number text not null check (char_length(trim(matric_number)) between 3 and 40),
  matric_number_key text not null check (char_length(trim(matric_number_key)) between 3 and 40),
  training_class_status text not null check (
    training_class_status in (
      'Teacher',
      'Assistant teacher',
      'In Workers in training class',
      'On workers IT',
      'In baptismal class',
      'In Believers class',
      'Other'
    )
  ),
  training_class_other text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_other_status_required check (
    (
      training_class_status = 'Other'
      and nullif(trim(coalesce(training_class_other, '')), '') is not null
    )
    or (
      training_class_status <> 'Other'
      and nullif(trim(coalesce(training_class_other, '')), '') is null
    )
  )
);

create unique index if not exists members_matric_number_key_unique
  on public.members (matric_number_key);

create unique index if not exists members_phone_number_key_unique
  on public.members (phone_number_key);

create index if not exists members_submitted_at_idx
  on public.members (submitted_at desc);

create index if not exists members_training_class_status_idx
  on public.members (training_class_status);

do $$
begin
  alter table public.members
    drop constraint if exists members_training_class_status_check;

  alter table public.members
    drop constraint if exists members_training_class_status_allowed;

  alter table public.members
    add constraint members_training_class_status_allowed
    check (
      training_class_status in (
        'Teacher',
        'Assistant teacher',
        'In Workers in training class',
        'On workers IT',
        'In baptismal class',
        'In Believers class',
        'Other'
      )
    )
    not valid;
exception
  when duplicate_object then
    null;
end;
$$;

create index if not exists members_gender_idx
  on public.members (gender);

-- Safe upgrade path for databases created before the Level field existed.
-- Existing rows can remain null; the application requires Level for all new submissions.
alter table public.members
  add column if not exists level text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'members_level_allowed'
      and conrelid = 'public.members'::regclass
  ) then
    alter table public.members
      add constraint members_level_allowed
      check (
        level is null
        or level in ('100 level', '200 level', '300 level', '400 level', '500 level')
      )
      not valid;
  end if;
end;
$$;

create index if not exists members_level_idx
  on public.members (level);

-- Safe upgrade path for databases created before the Bible Study unit field existed.
-- Existing rows can remain null; the application requires this field for all new submissions.
alter table public.members
  add column if not exists bible_study_unit text;

do $$
begin
  alter table public.members
    drop constraint if exists members_bible_study_unit_check;

  alter table public.members
    drop constraint if exists members_bible_study_unit_allowed;

  alter table public.members
    add constraint members_bible_study_unit_allowed
    check (
      bible_study_unit is null
      or bible_study_unit in (
        'Prayer unit',
        'Compliance unit',
        'Welfare unit',
        'Outline-Collation unit',
        'not interested'
      )
    )
    not valid;
exception
  when duplicate_object then
    null;
end;
$$;

create index if not exists members_bible_study_unit_idx
  on public.members (bible_study_unit);

create or replace function public.set_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
before update on public.members
for each row
execute function public.set_members_updated_at();

alter table public.members enable row level security;
alter table public.members force row level security;

-- The application writes and reads through server-only service-role routes.
-- No anon/authenticated policies are created, so public clients cannot select,
-- insert, update, or delete member rows through the Data API.
revoke all on public.members from anon;
revoke all on public.members from authenticated;

create table if not exists public.anonymous_feedback (
  id uuid primary key default gen_random_uuid(),
  observation_review text not null check (char_length(trim(observation_review)) between 3 and 2000),
  suggestion text not null check (char_length(trim(suggestion)) between 3 and 2000),
  submitted_at timestamptz not null default now()
);

alter table public.anonymous_feedback
  add column if not exists observation_review text;

alter table public.anonymous_feedback
  add column if not exists suggestion text;

alter table public.anonymous_feedback
  add column if not exists submitted_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'anonymous_feedback_observation_review_length'
      and conrelid = 'public.anonymous_feedback'::regclass
  ) then
    alter table public.anonymous_feedback
      add constraint anonymous_feedback_observation_review_length
      check (char_length(trim(observation_review)) between 3 and 2000)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'anonymous_feedback_suggestion_length'
      and conrelid = 'public.anonymous_feedback'::regclass
  ) then
    alter table public.anonymous_feedback
      add constraint anonymous_feedback_suggestion_length
      check (char_length(trim(suggestion)) between 3 and 2000)
      not valid;
  end if;
end;
$$;

create index if not exists anonymous_feedback_submitted_at_idx
  on public.anonymous_feedback (submitted_at desc);

alter table public.anonymous_feedback enable row level security;
alter table public.anonymous_feedback force row level security;

-- Anonymous feedback is written/read only through server-side service-role routes.
-- No member identifiers, IP addresses, user agents, or profile context are stored.
revoke all on public.anonymous_feedback from anon;
revoke all on public.anonymous_feedback from authenticated;
