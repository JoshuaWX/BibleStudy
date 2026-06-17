# RUC Bible Study Member Form

A secure member-registration and admin-dashboard application for the Redeemer's University Chapel of Power Bible Study Department.

The public form collects member details once, blocks duplicate matric numbers and phone numbers at the database level, and then offers an optional anonymous feedback step. Member records and feedback records are stored separately.

## Features

- Public member form with responsive, polished UI.
- Optional two-question anonymous feedback flow after successful registration.
- Server-side form submission through Next.js route handlers.
- Supabase Postgres storage with database-level unique constraints.
- Phone number and matric number normalization before insert.
- Protected admin dashboard with member search, filters, anonymous feedback view, and CSV exports.
- Supabase Auth email/password login for admins.
- Server-side `ADMIN_EMAILS` allowlist for admin authorization.
- RLS-enabled database table with no public read policy.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres

## Environment Variables

Create `.env` locally and configure these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Security notes:

- Do not commit `.env`.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe for the browser.
- `SUPABASE_SERVICE_ROLE_KEY` is powerful and must remain server-only.
- Only emails listed in `ADMIN_EMAILS` can access `/admin`, even if they can sign in with Supabase Auth.

## Database Setup

1. Open your Supabase project dashboard.
2. Go to **SQL Editor**.
3. Run the SQL in `supabase/schema.sql`.

That script creates the `members` and `anonymous_feedback` tables, indexes, uniqueness constraints, checks, trigger, and RLS posture.

If the table already exists from an earlier version, run the updated SQL again. The script includes safe upgrade sections that add the `level` and `bible_study_unit` columns without breaking existing rows.

Important:

- `matric_number_key` is unique.
- `phone_number_key` is unique.
- RLS is enabled and forced.
- No public `anon` or `authenticated` table policies are created.
- The app reads/writes member and feedback rows only from server-side code using the service-role key.
- Anonymous feedback is not linked to member records and does not store member identifiers, IP addresses, user agents, level, or class status.

## Admin Password Setup

Admin passwords are set in Supabase Auth, not inside this codebase.

To create an admin:

1. Go to your Supabase dashboard.
2. Open **Authentication**.
3. Open **Users**.
4. Click **Add user**.
5. Enter the admin email address.
6. Set a strong password.
7. Confirm/create the user.
8. Add that same email to `ADMIN_EMAILS` in `.env` and in your deployment environment.

Example:

```bash
ADMIN_EMAILS=chapel.admin@example.com,biblestudy.lead@example.com
```

The admin then signs in at:

```txt
/admin/login
```

If an admin forgets their password, reset it from **Supabase Dashboard > Authentication > Users**.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Useful routes:

- `/` - public member form
- `/admin/login` - admin sign in
- `/admin` - protected admin dashboard
- `/admin/export` - protected member CSV export
- `/admin/feedback/export` - protected anonymous feedback CSV export

## Verification

Run type checking:

```bash
npm run typecheck
```

Run the production build:

```bash
npm run build
```

Check production dependencies:

```bash
npm audit --omit=dev
```

## Deployment

Recommended deployment:

- Frontend/server: Vercel
- Database/Auth: Supabase

On Vercel, add the same environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`

After deployment, create Supabase Auth users for each admin email and confirm the deployed `/admin/login` route works.

## Data Collected

The member form collects:

- Surname
- Other names
- Department
- Level
- Bible Study unit preference
- Phone number
- Birthday
- Gender
- Matric number
- Training class status
- Optional custom status when `Other` is selected

The optional anonymous feedback step collects:

- Observations and reviews concerning Bible Study
- Suggestions to implement moving forward

Anonymous feedback intentionally does not collect or store:

- Name
- Matric number
- Phone number
- Department
- Level
- Bible Study unit preference
- Training class status
- IP address
- User agent

## Security Checklist

- `.env` is ignored by Git.
- Service-role key is never exposed to client components.
- Member submission is handled by a server route.
- Duplicate protection is enforced by Postgres unique indexes.
- Public clients cannot read member rows through Supabase Data API.
- Public clients cannot read anonymous feedback rows through Supabase Data API.
- Feedback is stored in `anonymous_feedback`, separate from `members`.
- Admin routes require both Supabase Auth and the email allowlist.
- CSV export requires approved admin access.

## Maintenance Notes

- Add or remove admins by updating `ADMIN_EMAILS` and managing users in Supabase Auth.
- Keep `supabase/schema.sql` as the source of truth for the current database setup.
- Do not relax RLS policies unless the access model changes intentionally.
