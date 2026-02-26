-- Taskora: Schema + RLS (Run first)

-- 0) Profiles (user role + points balance)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean default false,
  points_balance integer default 0,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles: read own"
on public.profiles for select
using (auth.uid() = id);

-- Only allow users to update their own row, but we will revoke direct UPDATE later for safety.
create policy "profiles: update own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Admin helper
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- 1) Offers
create table if not exists public.offers (
  id bigserial primary key,
  title text not null,
  description text,
  payout_points integer not null default 300,
  target_countries text[] default array['IN','PK'],
  url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.offers enable row level security;

-- Everyone logged-in can view active offers
create policy "offers: select active"
on public.offers for select
using (is_active = true);

-- Admin can manage offers
create policy "offers: admin all"
on public.offers for all
using (public.is_admin())
with check (public.is_admin());

-- 2) Click tracking
create table if not exists public.clicks (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_id bigint not null references public.offers(id) on delete cascade,
  clicked_at timestamptz default now(),
  ip text,
  user_agent text
);

alter table public.clicks enable row level security;

create policy "clicks: insert own"
on public.clicks for insert
with check (auth.uid() = user_id);

create policy "clicks: select own"
on public.clicks for select
using (auth.uid() = user_id);

create policy "clicks: admin select"
on public.clicks for select
using (public.is_admin());

-- 3) Proof submissions (screenshot proof)
create type public.submission_status as enum ('pending','approved','rejected');

create table if not exists public.proof_submissions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_id bigint not null references public.offers(id) on delete cascade,
  click_id bigint references public.clicks(id) on delete set null,
  screenshot_path text not null, -- storage path in bucket proofs
  note text,
  status public.submission_status default 'pending',
  admin_note text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table public.proof_submissions enable row level security;

create policy "submissions: insert own"
on public.proof_submissions for insert
with check (auth.uid() = user_id);

create policy "submissions: select own"
on public.proof_submissions for select
using (auth.uid() = user_id);

create policy "submissions: admin select"
on public.proof_submissions for select
using (public.is_admin());

-- prevent users from changing status/admin_note via RLS (they can update their note only; app doesn't expose update)
create policy "submissions: update own"
on public.proof_submissions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "submissions: admin update"
on public.proof_submissions for update
using (public.is_admin())
with check (public.is_admin());

-- 4) Reward ledger (audit trail)
create table if not exists public.reward_ledger (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  submission_id bigint unique references public.proof_submissions(id) on delete set null,
  points integer not null,
  created_at timestamptz default now()
);

alter table public.reward_ledger enable row level security;

create policy "ledger: select own"
on public.reward_ledger for select
using (auth.uid() = user_id);

create policy "ledger: admin select"
on public.reward_ledger for select
using (public.is_admin());

-- 5) Admin review function: approve/reject and credit points
create or replace function public.admin_review_submission(p_submission_id bigint, p_action text, p_admin_note text default null)
returns void
language plpgsql
security definer
as $$
declare
  v_user uuid;
  v_offer bigint;
  v_points int;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select user_id, offer_id into v_user, v_offer
  from public.proof_submissions
  where id = p_submission_id;

  if v_user is null then
    raise exception 'Submission not found';
  end if;

  if p_action = 'approve' then
    select payout_points into v_points from public.offers where id = v_offer;

    update public.proof_submissions
      set status='approved', admin_note=p_admin_note, reviewed_at=now()
    where id = p_submission_id;

    insert into public.reward_ledger(user_id, submission_id, points)
    values (v_user, p_submission_id, v_points);

    update public.profiles
      set points_balance = points_balance + v_points
    where id = v_user;

  elsif p_action = 'reject' then
    update public.proof_submissions
      set status='rejected', admin_note=p_admin_note, reviewed_at=now()
    where id = p_submission_id;
  else
    raise exception 'Invalid action';
  end if;
end;
$$;

-- Lock down direct modifications (points should only change via the function)
revoke insert, update, delete on public.reward_ledger from anon, authenticated;
revoke update on public.profiles from anon, authenticated;

-- 6) Withdraw requests (optional / future)
create type public.withdraw_status as enum ('locked','requested','paid','rejected');

create table if not exists public.withdraw_requests (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points_requested integer not null,
  method text not null,
  account_detail text not null,
  status public.withdraw_status default 'locked',
  admin_note text,
  created_at timestamptz default now(),
  processed_at timestamptz
);

alter table public.withdraw_requests enable row level security;

create policy "withdraw: insert own"
on public.withdraw_requests for insert
with check (auth.uid() = user_id);

create policy "withdraw: select own"
on public.withdraw_requests for select
using (auth.uid() = user_id);

create policy "withdraw: admin select"
on public.withdraw_requests for select
using (public.is_admin());

create policy "withdraw: admin update"
on public.withdraw_requests for update
using (public.is_admin())
with check (public.is_admin());
