# Taskora (Ready-to-deploy)

Taskora is a task-based reward credits website:
- Users sign up (email verification required)
- Users open a task, then submit screenshot proof
- Admin reviews submissions and approves/rejects
- On approval, points are added automatically

## Important compliance note
This project is meant for legitimate task verification. You must follow your CPA network / advertiser terms, local laws, and avoid deceptive or fraudulent practices.

---

## 1) Create Supabase project
1. Create a new Supabase project
2. Go to **Project Settings → API**
3. Copy:
   - Project URL
   - anon public key

## 2) Run SQL (required)
Open **Supabase → SQL Editor** and run the SQL files in order:

- `supabase-queries/01_schema_and_rls.sql`
- `supabase-queries/02_storage_policies.sql`
- `supabase-queries/03_seed_offers.sql` (optional)

## 3) Create Storage bucket
Supabase → Storage → Create bucket:
- Name: `proofs`
- Public: OFF (private)

## 4) Make yourself admin
1. Sign up in the app with your admin email
2. Run:

```sql
update public.profiles set is_admin = true where email = 'YOUR_EMAIL_HERE';
```

## 5) Configure environment variables
Copy `.env.example` to `.env.local` and fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 6) Run locally (optional)
```bash
npm install
npm run dev
```

## 7) Deploy to Vercel
1. Push this project to GitHub
2. Vercel → New Project → Import from GitHub
3. Add Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Default business rules
- 300 points = $1
- Minimum withdrawal: 1500 points ($5)
- No instant points: everything pending until admin approval


## Note
This project uses the import alias `@/` configured in `tsconfig.json` (paths: `@/*` -> `./*`).
