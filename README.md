# Inbox — CRM for email marketing agencies

One workspace for an agency that runs newsletters, flows and campaigns for Shopify/Klaviyo brands: sales pipeline, clients and brand kits, a cross-client campaign planner, tasks and workload, and client reporting.

Built with React + TypeScript, Vite, Tailwind CSS, shadcn-style components on Radix UI, cmdk, Recharts, dnd-kit and Zustand.

## Getting started

The app runs on Supabase. There is no demo mode and no sample data: a new workspace starts empty.

- **Database:** the migrations in `supabase/migrations/` run automatically through the Supabase GitHub integration when `main` changes.
- **Connection:** the app is already set to the production Supabase project (the URL and publishable key in `src/lib/supabase.ts`, both public by design). `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` override them.
- **Hosting:** Vercel deploys from GitHub; `vercel.json` makes direct links such as `/clients/…` work.
- **Auth:** in Supabase → Authentication → URL Configuration, the Site URL must be the Vercel address, otherwise confirmation emails link to localhost.

To run it locally: `npm install && npm run dev`.

The first person to create an account becomes the admin. Admins add colleagues by email on the Team page; those colleagues then create an account with that email.

## What's inside

- **Dashboard**: greeting, KPIs (active clients, MRR, sends this week, open tasks, open rate, client revenue), today's tasks and sends, a 7-day send timeline, pipeline value per stage and recent activity.
- **Leads**: a Kanban board with drag & drop (New lead → Contacted → Audit sent → Call booked → Proposal sent → Won / Lost) and a sortable, filterable table. The lead drawer has contact, store info, follow-up date, notes and a timeline. Won leads have a **Convert to client** button.
- **Clients**: grid and table views. Each client page has tabs for Overview, Brand kit, Campaigns, Flows, Reports, Files and Activity.
- **Campaign planner**: month and week calendars colour-coded per client (drag a campaign to another day to reschedule it), plus a status board from Idea to Sent. Filter by client, status, assignee and date range. The campaign drawer has the subject and preview text with an inbox preview, a rich-text copy editor, a design link, a checklist, approval status, comments and linked tasks.
- **Tasks**: My tasks and Team tasks, grouped into Overdue, Today, Next 7 days, Later and No date. Press `T` anywhere to quick-add a task.
- **Reports**: agency-wide or per client, for this month, 3 months or 6 months, each compared with the previous period. Shows a revenue trend, campaign performance and a breakdown table, with **Export as PDF**, which opens the browser's print dialog with a print layout.
- **Team & Settings**: workload against each person's capacity, roles, agency profile, packages and pricing, editable pipeline stages (drag to reorder), integration placeholders and appearance.

### Keyboard shortcuts

`Ctrl/⌘ K` command palette · `/` search · `T` new task · `N` new campaign · `G` then `D/L/C/P/T/R/M/S` to switch pages · `[` toggle sidebar · `Shift D` dark mode · `?` list of all shortcuts.

## Data & security

- **Data model:** each table stores documents as `id` + `data jsonb`, in the same shape as `src/data/types.ts`. Workspace settings (agency profile, packages, pipeline stages, integrations) live in the `settings` table. Default packages and pipeline stages are created by the migration.
- **Permissions:** row-level security only lets team members read data. Writes follow the role: leads are admin/account manager only; settings and team are admin only; campaigns, tasks and clients are open to the whole team.
- **Live updates:** every change is saved straight away, and Realtime pushes it to everyone else who has the app open.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: type-check and build for production
- `npm run preview`: serve the production build
