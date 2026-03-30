# AIREV Pipeline CRM — Setup & Deploy Guide

A shared internal CRM for tracking your deal pipeline. Built with React + Supabase, deployed on Vercel. All admins see live changes in real-time via Supabase Realtime.

---

## Architecture

```
React (Vite) → Supabase Postgres + Auth + Realtime → Vercel (hosting)
```

- **Auth**: Google SSO via Supabase (restrict to your team domain)
- **Database**: Supabase Postgres with RLS (all authenticated users = full access)
- **Realtime**: When Youssef updates a deal stage, Christi sees it instantly
- **Hosting**: Vercel free tier (auto-deploys from GitHub)

---

## Step 1: Create Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `airev-crm`, pick a region close to you (Middle East or EU)
3. Save the **database password** somewhere safe
4. Once created, go to **Settings → API** and copy:
   - `Project URL` (e.g. `https://abc123.supabase.co`)
   - `anon / public` key

## Step 2: Run the Database Schema (2 min)

1. In Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run** — this creates:
   - `projects` table (your deals)
   - `team_members` table (assignable leads)
   - `activity_log` table (audit trail)
   - Row Level Security policies
   - Realtime subscriptions

## Step 3: Enable Google SSO (5 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web Application)
   - Authorized redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**
4. In Supabase Dashboard → **Authentication → Providers → Google**
   - Toggle **Enable**
   - Paste Client ID and Client Secret
   - Save

### Optional: Restrict to your team's domain

In Supabase → **Authentication → Policies**, you can add a hook or check to only allow `@airev.ai` (or whichever domain your team uses) email addresses. Simplest approach: add this SQL after the schema:

```sql
-- Only allow specific email domains
create or replace function check_email_domain()
returns trigger as $$
begin
  if new.email not like '%@airev.ai' then
    raise exception 'Unauthorized email domain';
  end if;
  return new;
end;
$$ language plpgsql;
```

## Step 4: Configure Environment Variables (1 min)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Supabase URL and anon key

## Step 5: Run Locally (2 min)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` — you should see the Google sign-in screen.

## Step 6: Deploy to Vercel (5 min)

1. Push the project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "AIREV Pipeline CRM"
   git remote add origin https://github.com/YOUR_ORG/airev-crm.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Import Project** → select the repo

3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key

4. Deploy. Done.

5. **Update Google OAuth redirect**: Add your Vercel domain (`https://airev-crm.vercel.app`) to the authorized redirect URIs in Google Cloud Console, AND in Supabase → Authentication → URL Configuration → **Site URL** and **Redirect URLs**.

---

## File Structure

```
airev-crm/
├── index.html              # Entry HTML
├── package.json            # Dependencies
├── vite.config.js          # Vite config
├── .env.example            # Environment template
├── supabase/
│   └── schema.sql          # Database schema + RLS + realtime
└── src/
    ├── main.jsx            # React entry
    ├── App.jsx             # Main CRM component (all UI)
    ├── supabaseClient.js   # Supabase client init
    ├── useAuth.js          # Auth hook (Google SSO)
    └── useData.js          # Data hooks (projects + team CRUD + realtime)
```

---

## How Multi-Admin Realtime Works

When any admin makes a change (add project, update stage, edit details), Supabase broadcasts it via WebSocket to all connected clients. Every browser tab running the CRM will see the update within ~200ms. No polling, no refresh needed.

---

## Cost

At your current scale this is completely free:
- **Supabase Free Tier**: 500MB database, 50K auth users, unlimited API calls
- **Vercel Free Tier**: unlimited deploys, custom domain support
- **Google OAuth**: free

You'd need to upgrade (~$25/mo) only if you exceed 500MB of data or need advanced features like custom SMTP for auth emails.
