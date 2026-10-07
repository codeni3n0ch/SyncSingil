# SyncSINGIL — Microloan Management System

A real database-backed capstone system based on the supplied SyncSINGIL prototype.

## Stack
- Next.js 15
- TypeScript / React
- Supabase PostgreSQL + Auth
- Vercel
- Tailwind CSS v4

## Run locally

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Then:

```bash
npm run dev
```

Open http://localhost:3000.

## Supabase database setup

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/schema.sql`.
4. Create your Auth users in **Authentication → Users**.
5. The Auth trigger automatically creates a `profiles` row.
6. Use the Admin **User Access** page to assign a role by email, or run the SQL helper manually.

### Roles

- **Administrator** — full dashboard, user access, reports, borrowers, loans, collections, and payments.
- **Collector** — collection-focused dashboard, collection schedule, borrower lookup, and payment recording.
- **Office Staff** — borrower and loan management dashboard and monitoring tools.

A user's dashboard is selected from the `profiles.role` value associated with their login email.

### Assign a role by email

After the Auth user exists, an administrator can use **User Access → Assign Dashboard Role**.

The database helper can also be run by an administrator in SQL Editor:

```sql
select public.set_user_role_by_email('collector@example.com','collector');
select public.set_user_role_by_email('office@example.com','staff');
```

The user should sign out and sign in again after a role change.

## Loan products

The loan form supports:

- Gadgets
- Cash
- Livestock
- Other

## Interest calculation

The current implementation uses a **flat interest calculation on the original principal**:

`interest = original_amount × interest_rate / 100`

Example: ₱10,000 at 15% = ₱1,500 interest and ₱11,500 total payable.

Each loan stores its interest rate and interest balance. During collection, the system shows:

- the loan's interest rate,
- remaining interest,
- the interest portion of the current payment,
- the principal portion of the current payment,
- and the balance after collection.

Payments are applied to outstanding interest first, then principal. A payment amount must be greater than ₱0 and cannot exceed the remaining loan balance.

If your capstone uses a different interest formula (for example, per-installment interest, diminishing balance, or a different schedule), change the calculation before using real financial records.

## Deploy to Vercel

Push the project to GitHub, import the repository into Vercel, and add these environment variables for Production/Preview/Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do **not** upload `.env.local`, `.next`, or `node_modules` to GitHub.

## Production checklist

Before using real borrower/financial data, add institution-specific audit logs, backups, MFA, approval workflows, and any legal/compliance controls required by your organization.
