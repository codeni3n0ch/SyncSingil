# SyncSINGIL — refreshed web app starter

SyncSINGIL is a responsive microloan-management interface with borrower and staff views. This update adds a cleaner UI and an optional Supabase Auth + PostgreSQL Realtime connection. GitHub is used for source control and Vercel for hosting.

## Stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Authentication:** Supabase Auth (email/password) when cloud mode is configured
- **Database:** Supabase PostgreSQL (`syncsingil_app_state` JSONB demo-state table)
- **Live updates:** Supabase Realtime / Postgres Changes
- **Repository:** GitHub
- **Hosting:** Vercel (static site)

## 1. Run locally

1. Extract the ZIP and open the `syncsingil` folder in VS Code.
2. Start a local server (VS Code Live Server is fine).
3. Open the local URL in your browser.
4. Without Supabase configuration, the original local demo accounts still work:
   - Borrower: `juan` / `demo123`
   - Admin: `admin` / `admin123`

Local demo data is stored in this browser's `localStorage` only.

## 2. Configure Supabase

1. Create a project at [Supabase](https://supabase.com/).
2. Open **SQL Editor** and run the contents of `supabase-schema.sql`.
3. Open **Project Settings → API** and copy the Project URL and `anon` / publishable public key.
4. Put those values in `supabase-config.js`:

```js
window.SYNCSINGIL_SUPABASE = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_PUBLIC_KEY'
};
```

5. In **Authentication → Users**, create each login account using the email address that matches the user's email in the SyncSINGIL user records. Use Supabase Auth passwords; the old demo passwords are not used in cloud mode.
6. The authenticated user's email must have a matching user profile in the app's `users` data. For the initial demo, the sample profiles are included in the starter state. If the database table is empty, the first signed-in user initializes it with the sample state.
7. Sign in using the email (or its matching username) and the Supabase Auth password.

When cloud mode is active, changes are saved to Supabase and database updates are broadcast to connected browsers in real time. Password fields are deliberately excluded from the JSON state before it is sent to Supabase.

## 3. Publish with GitHub

Create a new GitHub repository, then run these commands from the `syncsingil` folder:

```bash
git init
git add .
git commit -m "Refresh SyncSINGIL interface and add Supabase realtime"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL. Do not commit private keys or service-role keys. The browser app should only use the Supabase anon/publishable key.

## 4. Deploy to Vercel

1. Sign in to [Vercel](https://vercel.com/) with GitHub.
2. Choose **Add New → Project** and import your SyncSINGIL repository.
3. Keep the framework preset as **Other**. No build command is needed; the app is static HTML/CSS/JS.
4. Set the output directory to `.` (the project root), then deploy.
5. After each GitHub push, Vercel automatically creates a new deployment.
6. In Supabase **Authentication → URL Configuration**, add your deployed Vercel URL to the allowed Site URL / Redirect URLs.

## Important security note — classroom/demo use only

The Realtime integration in this starter uses one shared JSONB row so the existing prototype can sync without a full rewrite. Its SQL policies allow every authenticated demo user to read and update the shared state. That is **not suitable for real borrower information, production lending, or actual payments**. Before production, migrate the data into separate relational tables (profiles, borrowers, loans, installments, payments, collections), enforce role-based and borrower-scoped Row Level Security for every table, validate financial changes in trusted server-side functions, add audit logging, and integrate a regulated payment provider. Never put a Supabase service-role key in frontend code.

The payment form remains a demonstration only: it does not transfer money. SMS/email reminder controls are previews/preferences, not message delivery. The Blockchain-Inspired Ledger is illustrative, not a real blockchain.
