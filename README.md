# FUK Timetable Office

A responsive examination and lecture timetable application for the Federal University of Kashere. It includes a Vercel serverless API and a Supabase Postgres shared workspace. The original local mode remains available for development and offline demonstrations.

## Full-stack architecture

- **Web app:** static HTML, CSS and JavaScript served by Vercel; works on desktop and mobile browsers.
- **API:** authenticated Vercel Functions at `/api/config` and `/api/data`.
- **Database and sign-in:** Supabase Auth and Postgres. Only authenticated accounts can read or change the shared timetable. Create staff accounts through the Supabase dashboard; public account registration is not exposed.
- **Conflict handling:** the shared data has a version number. If two people edit at once, a stale save is rejected rather than silently overwriting the newer version.
- **Source and release:** GitHub is the source repository. Connect the repository to Vercel to receive preview deployments for branches and deploy the configured production branch.

## Deploy to Vercel from GitHub

1. Push the project files to the GitHub repository.
2. In Vercel, import that GitHub repository as a project. Use the repository root as the project root and allow Vercel to detect the static site and `/api` Node.js Functions.
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as project environment variables for Production, Preview and Development. The publishable/anon key is designed for browser use; database access is restricted by Supabase Row Level Security.
4. Deploy the Supabase migration in `supabase/migrations/202610310001_shared_timetable.sql` using the Supabase SQL editor or Supabase CLI.
5. In Supabase Authentication settings, disable public sign-ups. Create individual staff users for people authorised to manage the timetable.
6. Redeploy from Vercel after setting environment variables. Sign in at the deployment URL with an issued account. The same timetable then appears across authorised devices.

Do not add database passwords, service-role keys, Vercel tokens or other secrets to GitHub. The app only needs the Supabase project URL and publishable/anon key; the database table's RLS policy requires an authenticated session.

## Run locally

Run `python serve.py` and visit `http://localhost:8000`. Without server environment variables, local mode saves to this browser's local storage and is intended for development or demonstrations. For local full-stack development, set `SUPABASE_URL` and `SUPABASE_ANON_KEY`, apply the migration, and run the project using Vercel's local development CLI so the `/api` functions are available.

## Features

- Faculties, departments, levels, cohorts, courses, student counts, lecturer assignments and venue register.
- Forty-seven seeded venues from the supplied provisional timetable, with editable capacity, type, location and archive status.
- Timetable date range, scheduling days and configurable time periods. Six default periods match the supplied PDF: 08:00–10:00, 10:00–12:00, 12:00–13:00, 13:00–14:00, 14:00–16:00 and 16:00–18:00.
- Conflict prevention for venues, courses, cohorts and lecturers; Sunday is excluded.
- Exam candidates are split across available rooms at a configurable safe occupancy target (84% by default, so a 500-seat venue is assigned up to 420 candidates).
- Exam summaries by faculty, department and level list each paper's date, time, rooms and candidate allocations.
- Manual timetable edits with validation, CSV course/venue import and export, JSON backup and restore, and printable/PDF reports.

## Scheduling assumptions

The supplied PDF is a provisional lecture timetable template. It supplies venue names/capacities and reference time periods, not official examination rules. Exam duration, room-spacing target, exam gaps and daily limits are configurable assumptions for departmental review. The generator is a greedy heuristic and can flag courses it could not place; staff must review generated schedules before any official release.

LT 3 is listed as capacity 296 in the timetable rows while its venue legend describes a 350-capacity room. The application retains the row capacity and surfaces this discrepancy for confirmation before operational use.

## CSV templates

See `sample-courses.csv` and `sample-venues.csv`. Course columns are `code,title,department,faculty,level,cohort,students,lecturer,duration,venueType`. Venue columns are `name,capacity,type,location,description,active`.

