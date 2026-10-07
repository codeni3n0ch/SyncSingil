-- =========================================================
-- SyncSINGIL DATABASE SCHEMA / MIGRATION
-- =========================================================
-- Run this in Supabase SQL Editor.
-- Safe to run more than once.
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- PROFILES / ROLES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'staff'
    check (role in ('admin','collector','staff')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists full_name text;

alter table public.profiles
  add column if not exists role text not null default 'staff';


-- Return the signed-in user's role without causing RLS recursion.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'staff'
  );
$$;


-- =========================================================
-- BORROWERS
-- =========================================================

create table if not exists public.borrowers (
  id uuid primary key default gen_random_uuid(),
  borrower_code text unique not null,
  full_name text not null,
  contact_number text,
  address text,
  area text,
  status text not null default 'active'
    check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);


-- =========================================================
-- LOANS
-- =========================================================

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null
    references public.borrowers(id)
    on delete restrict,

  loan_code text unique not null,

  product text not null
    check (product in ('Gadgets','Cash','Livestock','Other')),

  original_amount numeric(14,2) not null
    check (original_amount > 0),

  interest_rate numeric(7,3) not null default 0
    check (interest_rate >= 0 and interest_rate <= 100),

  interest_amount numeric(14,2) not null default 0
    check (interest_amount >= 0),

  total_payable numeric(14,2) not null default 0
    check (total_payable >= 0),

  principal_balance numeric(14,2) not null default 0
    check (principal_balance >= 0),

  interest_balance numeric(14,2) not null default 0
    check (interest_balance >= 0),

  balance numeric(14,2) not null
    check (balance >= 0),

  frequency text not null
    check (frequency in ('daily','weekly','monthly')),

  status text not null default 'active'
    check (status in ('active','paid','overdue','cancelled')),

  due_amount numeric(14,2) not null default 0
    check (due_amount >= 0),

  next_due_date date,

  created_at timestamptz not null default now()
);


-- =========================================================
-- UPGRADE OLDER DATABASES
-- =========================================================

alter table public.loans
  add column if not exists interest_rate numeric(7,3) not null default 0;

alter table public.loans
  add column if not exists interest_amount numeric(14,2) not null default 0;

alter table public.loans
  add column if not exists total_payable numeric(14,2) not null default 0;

alter table public.loans
  add column if not exists principal_balance numeric(14,2) not null default 0;

alter table public.loans
  add column if not exists interest_balance numeric(14,2) not null default 0;


-- Existing loans are treated as zero-interest loans
-- so their balances do not unexpectedly change.

update public.loans
set
  interest_rate = coalesce(interest_rate, 0),

  interest_amount = coalesce(interest_amount, 0),

  total_payable =
    case
      when coalesce(total_payable, 0) = 0
        then original_amount + coalesce(interest_amount, 0)
      else total_payable
    end,

  principal_balance =
    case
      when coalesce(principal_balance, 0) = 0
           and balance > 0
        then balance
      else coalesce(principal_balance, 0)
    end,

  interest_balance = coalesce(interest_balance, 0)

where true;


-- =========================================================
-- NORMALIZE LEGACY PRODUCT LABELS
-- =========================================================

update public.loans
set product =
  case

    when lower(product) like '%cash%'
      then 'Cash'

    when lower(product) like '%cell%'
      or lower(product) like '%phone%'
      or lower(product) like '%gadget%'
      then 'Gadgets'

    when lower(product) like '%livestock%'
      or lower(product) like '%animal%'
      then 'Livestock'

    else 'Other'

  end;


-- =========================================================
-- ENFORCE LOAN PRODUCT OPTIONS
-- =========================================================

alter table public.loans
  drop constraint if exists loans_product_check;

alter table public.loans
  add constraint loans_product_check
  check (product in ('Gadgets','Cash','Livestock','Other'));


-- =========================================================
-- PAYMENTS
-- =========================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),

  loan_id uuid not null
    references public.loans(id)
    on delete restrict,

  borrower_id uuid not null
    references public.borrowers(id)
    on delete restrict,

  amount numeric(14,2) not null
    check (amount > 0),

  principal_amount numeric(14,2) not null default 0
    check (principal_amount >= 0),

  interest_amount numeric(14,2) not null default 0
    check (interest_amount >= 0),

  interest_rate_snapshot numeric(7,3) not null default 0
    check (
      interest_rate_snapshot >= 0
      and interest_rate_snapshot <= 100
    ),

  balance_after numeric(14,2) not null default 0
    check (balance_after >= 0),

  payment_date date not null default current_date,

  method text not null default 'Cash',

  recorded_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);


alter table public.payments
  add column if not exists principal_amount
  numeric(14,2) not null default 0;

alter table public.payments
  add column if not exists interest_amount
  numeric(14,2) not null default 0;

alter table public.payments
  add column if not exists interest_rate_snapshot
  numeric(7,3) not null default 0;

alter table public.payments
  add column if not exists balance_after
  numeric(14,2) not null default 0;


-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_loans_borrower
  on public.loans(borrower_id);

create index if not exists idx_loans_status
  on public.loans(status);

create index if not exists idx_loans_due_date
  on public.loans(next_due_date);

create index if not exists idx_payments_loan
  on public.payments(loan_id);

create index if not exists idx_payments_date
  on public.payments(payment_date);

create index if not exists idx_payments_recorded_by
  on public.payments(recorded_by);


-- =========================================================
-- PAYMENT CALCULATION
-- =========================================================
-- A collection is applied to interest first,
-- then principal.
--
-- The exact interest rate used for the collection
-- is saved on the payment.
-- =========================================================

create or replace function public.prepare_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$

declare
  l public.loans%rowtype;

  interest_part numeric(14,2);
  principal_part numeric(14,2);
  new_balance numeric(14,2);

begin

  select *
  into l
  from public.loans
  where id = new.loan_id
  for update;


  if not found then
    raise exception 'Loan not found.';
  end if;


  if new.amount is null
     or new.amount <= 0 then

    raise exception
      'Payment amount must be greater than zero.';

  end if;


  if new.amount > l.balance then

    raise exception
      'Payment cannot be greater than the remaining loan balance of %.',
      l.balance;

  end if;


  -- Apply payment to interest first.
  interest_part :=
    least(
      new.amount,
      l.interest_balance
    );


  -- Remaining amount goes to principal.
  principal_part :=
    new.amount - interest_part;


  -- Calculate new balance.
  new_balance :=
    greatest(
      0,
      l.balance - new.amount
    );


  -- Save payment breakdown.
  new.interest_amount :=
    round(interest_part, 2);

  new.principal_amount :=
    round(principal_part, 2);

  new.interest_rate_snapshot :=
    l.interest_rate;

  new.balance_after :=
    round(new_balance, 2);


  return new;

end;
$$;


-- =========================================================
-- PAYMENT PREPARE TRIGGER
-- =========================================================

drop trigger if exists payment_prepare
on public.payments;

create trigger payment_prepare

before insert
on public.payments

for each row
execute function public.prepare_payment();


-- =========================================================
-- APPLY PAYMENT TO LOAN
-- =========================================================

create or replace function public.apply_payment_to_loan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$

begin

  update public.loans

  set

    principal_balance =
      greatest(
        0,
        principal_balance - new.principal_amount
      ),

    interest_balance =
      greatest(
        0,
        interest_balance - new.interest_amount
      ),

    balance =
      greatest(
        0,
        balance - new.amount
      ),

    status =
      case

        when greatest(
          0,
          balance - new.amount
        ) = 0

        then 'paid'

        else status

      end

  where id = new.loan_id;


  return new;

end;
$$;


-- =========================================================
-- PAYMENT UPDATE TRIGGER
-- =========================================================

drop trigger if exists payment_updates_loan
on public.payments;

create trigger payment_updates_loan

after insert
on public.payments

for each row
execute function public.apply_payment_to_loan();


-- =========================================================
-- AUTH PROFILE CREATION
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$

begin

  insert into public.profiles(
    id,
    email,
    full_name,
    role
  )

  values (

    new.id,

    new.email,

    coalesce(
      new.raw_user_meta_data->>'full_name',
      ''
    ),

    case

      when new.raw_user_meta_data->>'role'
        in ('admin','collector','staff')

      then new.raw_user_meta_data->>'role'

      else 'staff'

    end

  )

  on conflict (id)

  do update

  set

    email = excluded.email,

    full_name =
      case

        when public.profiles.full_name is null
          or public.profiles.full_name = ''

        then excluded.full_name

        else public.profiles.full_name

      end;


  return new;

end;
$$;


-- =========================================================
-- AUTH USER TRIGGER
-- =========================================================

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created

after insert
on auth.users

for each row
execute function public.handle_new_user();


-- =========================================================
-- ADMIN ROLE ASSIGNMENT
-- =========================================================
-- Admin helper for assigning dashboard role by email.
--
-- Example:
--
-- select public.set_user_role_by_email(
--   'collector@example.com',
--   'collector'
-- );
-- =========================================================

create or replace function public.set_user_role_by_email(
  p_email text,
  p_role text
)

returns public.profiles

language plpgsql
security definer
set search_path = public

as $$

declare
  result public.profiles;

begin

  if public.current_user_role() <> 'admin' then

    raise exception
      'Only an administrator can change user roles.';

  end if;


  if p_role not in (
    'admin',
    'collector',
    'staff'
  ) then

    raise exception
      'Role must be admin, collector, or staff.';

  end if;


  update public.profiles

  set role = p_role

  where lower(email) =
        lower(trim(p_email))

  returning *
  into result;


  if result.id is null then

    raise exception
      'No profile exists for that email. Create the Auth user first.';

  end if;


  return result;

end;
$$;


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles
  enable row level security;

alter table public.borrowers
  enable row level security;

alter table public.loans
  enable row level security;

alter table public.payments
  enable row level security;


-- =========================================================
-- PROFILE POLICIES
-- =========================================================

drop policy if exists "authenticated profiles"
on public.profiles;

drop policy if exists "profiles own or admin"
on public.profiles;

create policy "profiles own or admin"

on public.profiles

for select
to authenticated

using (
  id = auth.uid()
  or public.current_user_role() = 'admin'
);


-- =========================================================
-- BORROWER POLICIES
-- =========================================================

drop policy if exists "authenticated borrowers"
on public.borrowers;

drop policy if exists "borrowers read"
on public.borrowers;

drop policy if exists "borrowers write"
on public.borrowers;


create policy "borrowers read"

on public.borrowers

for select
to authenticated

using (true);


create policy "borrowers write"

on public.borrowers

for all
to authenticated

using (
  public.current_user_role()
  in ('admin','staff')
)

with check (
  public.current_user_role()
  in ('admin','staff')
);


-- =========================================================
-- LOAN POLICIES
-- =========================================================

drop policy if exists "authenticated loans"
on public.loans;

drop policy if exists "loans read"
on public.loans;

drop policy if exists "loans write"
on public.loans;


create policy "loans read"

on public.loans

for select
to authenticated

using (true);


create policy "loans write"

on public.loans

for all
to authenticated

using (
  public.current_user_role()
  in ('admin','staff')
)

with check (
  public.current_user_role()
  in ('admin','staff')
);


-- =========================================================
-- PAYMENT POLICIES
-- =========================================================

drop policy if exists "authenticated payments"
on public.payments;

drop policy if exists "payments read"
on public.payments;

drop policy if exists "payments insert"
on public.payments;

drop policy if exists "payments admin edit"
on public.payments;

-- IMPORTANT:
-- This was missing in the previous version.
-- It prevents the "policy already exists" error.

drop policy if exists "payments admin delete"
on public.payments;


-- PAYMENT READ

create policy "payments read"

on public.payments

for select
to authenticated

using (true);


-- PAYMENT INSERT
-- Admin and collector can record payments.

create policy "payments insert"

on public.payments

for insert
to authenticated

with check (
  public.current_user_role()
  in ('admin','collector')
  and recorded_by = auth.uid()
);


-- PAYMENT UPDATE
-- Only admin can edit payment records.

create policy "payments admin edit"

on public.payments

for update
to authenticated

using (
  public.current_user_role() = 'admin'
)

with check (
  public.current_user_role() = 'admin'
);


-- PAYMENT DELETE
-- Only admin can delete payment records.

create policy "payments admin delete"

on public.payments

for delete
to authenticated

using (
  public.current_user_role() = 'admin'
);


-- =========================================================
-- OPTIONAL ROLE ASSIGNMENT EXAMPLES
-- =========================================================

-- After creating the Auth users, run one of these as needed.

-- Admin:
-- select public.set_user_role_by_email(
--   'admin@example.com',
--   'admin'
-- );

-- Collector:
-- select public.set_user_role_by_email(
--   'collector@example.com',
--   'collector'
-- );

-- Office Staff:
-- select public.set_user_role_by_email(
--   'office@example.com',
--   'staff'
-- );


-- =========================================================
-- END OF SYNCSINGIL SCHEMA
-- =========================================================