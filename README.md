# Inbox — CRM for email marketing agencies

One workspace for an agency that runs newsletters, flows and campaigns for Shopify/Klaviyo brands: sales pipeline, clients and brand kits, a cross-client campaign planner, tasks and workload, and client reporting.

Built with React + TypeScript, Vite, Tailwind CSS, shadcn-style components on Radix UI, cmdk, Recharts, dnd-kit and Zustand.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in as one of the demo team members (any password works in demo mode). Signing in as different people shows the role permissions:

| Person | Role | Can do |
| --- | --- | --- |
| Sophie de Vries | Admin | Everything, including settings, team, billing and the pipeline |
| Daan Jansen | Copywriter | Campaigns and tasks; no billing, settings or pipeline edits |
| Mila Bakker | Designer | Campaigns and tasks; no billing, settings or pipeline edits |

The full permission matrix is on the **Team** page.

## What's inside

- **Dashboard**: greeting, KPIs (active clients, MRR, sends this week, open tasks, open rate, client revenue), today's tasks and sends, a 7-day send timeline, pipeline value per stage and recent activity.
- **Leads**: a Kanban board with drag & drop (New lead → Contacted → Audit sent → Call booked → Proposal sent → Won / Lost) and a sortable, filterable table. The lead drawer has contact, store info, follow-up date, notes and a timeline. Won leads have a **Convert to client** button.
- **Clients**: grid and table views. Each client page has tabs for Overview, Brand kit, Campaigns, Flows, Reports, Files and Activity.
- **Campaign planner**: month and week calendars colour-coded per client (drag a campaign to another day to reschedule it), plus a status board from Idea to Sent. Filter by client, status, assignee and date range. The campaign drawer has the subject and preview text with an inbox preview, a rich-text copy editor, a design link, a checklist, approval status, comments and linked tasks.
- **Tasks**: My tasks and Team tasks, grouped into Overdue, Today, Next 7 days, Later and No date. Press `T` anywhere to quick-add a task.
- **Reports**: agency-wide or per client, for this month, 3 months or 6 months, each compared with the previous period. Shows a revenue trend, campaign performance and a breakdown table, with **Export as PDF**, which opens the browser's print dialog with a print layout.
- **Team & Settings**: workload against each person's capacity, roles, agency profile, packages and pricing, editable pipeline stages (drag to reorder), integration placeholders, appearance and a demo-data reset.

### Keyboard shortcuts

`Ctrl/⌘ K` command palette · `/` search · `T` new task · `N` new campaign · `G` then `D/L/C/P/T/R/M/S` to switch pages · `[` toggle sidebar · `Shift D` dark mode · `?` list of all shortcuts.

## Data

On first load the app seeds realistic demo data relative to today: 8 clients, 15 leads across every stage, 30 campaigns over the current and next month (plus some earlier sent campaigns, so reports have data), 25 tasks, 3 team members and 12 months of metrics. Data is kept in `localStorage`. Use **Settings → Workspace data → Reset demo data** to start over.

### Supabase

Without Supabase settings the app runs in demo mode and stores data in the browser. With them, Supabase is the shared database for the whole team.

1. **Database:** `supabase/migrations/` holds the schema. Through the Supabase GitHub integration it runs automatically when this branch is merged into the production branch. You can also paste the file into the SQL editor.
2. **Frontend:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API) in `.env` locally, or in your hosting provider's environment variables.
3. **Auth:** under Authentication → URL Configuration, set the Site URL to the app's address so confirmation emails link back correctly.

How it works:
- **Access:** the first person to create an account becomes the admin. Everyone else needs an invite: the admin adds their email on the Team page, and then they create an account with that email. Anyone else who signs up sees a "no access" screen and can't read any data.
- **Permissions:** row-level security enforces roles in the database. Leads are admin/account manager only; settings and team are admin only; campaigns, tasks and clients are open to the whole team.
- **Live updates:** every change is saved straight away, and Realtime pushes it to everyone else who has the app open.
- **Demo data:** Settings → Workspace data → **Load demo data** fills a new workspace with the demo set.
- **Data model:** each table stores documents as `id` + `data jsonb`, in the same shape as `src/data/types.ts`.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: type-check and build for production
- `npm run preview`: serve the production build
