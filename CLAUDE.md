@AGENTS.md

# Dental Lab — Project Context for Claude Code

## What this project is
A dental lab order management system + AI voice agent platform.
Live at: https://dental-lab-seven.vercel.app
Stack: Next.js 16 App Router, Supabase (auth + database), Tailwind CSS, Vercel

---

## Design system
- **Glass UI** throughout — `.glass-card` utility class on all surfaces
- **Background**: rich blue/purple gradient with floating color orbs behind glass cards
- **Primary sidebar**: 48px icon rail (3 icons: Main, AI, Settings) + 176px sliding secondary panel
- CSS variables in `app/globals.css`: `--glass-bg`, `--glass-border`, `--blur`, `--glass-shadow`
- Background gradient: `linear-gradient(135deg, #dde8ff 0%, #e8d8ff 30%, #cfe8ff 60%, #d4f0f8 100%)`

---

## App structure

### Lab dashboard (`app/(lab)/`)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Live dashboard — stage stats, area chart, recent orders, auto-refreshes every 10s |
| `/orders/new` | Create new order form (practice, doctor, patient, product, teeth, dates) |
| `/orders/[id]` | Order detail — stage progress, history, patient sidebar, **Edit order** button top-right |
| `/orders/[id]/edit` | Edit existing order — pre-filled form, saves via PATCH `/api/orders/[id]` |
| `/lookup` | Patient lookup — shows all patients oldest→latest, searchable by name via `?q=` |
| `/calendar` | FullCalendar showing pickup dates only (allDay events) |
| `/ai` | AI tickets — open/resolved tickets from ElevenLabs voice agent |
| `/ai/settings` | Agent settings — voice, greeting, office hours, location URL → syncs to ElevenLabs |
| `/ai/status` | Toggle agent on/off (gates Twilio calls) |
| `/ai/history` | Full call history table |
| `/settings/practices` | Manage practices |
| `/settings/doctors` | Manage doctors |
| `/settings/products` | Manage products |

### Doctor portal (`app/(portal)/`)
| Route | Purpose |
|-------|---------|
| `/portal` | Doctor's patient list (their orders only) |
| `/portal/ask-ai` | AI chat — asks questions about their patients, powered by Groq Llama 3.1 |
| `/portal/orders/[id]` | Doctor view of order detail |

### Auth (`app/(auth)/`)
- `/login` — Glass UI login form with animated steps (email → password)
- `/doctor-setup` — First-time password setup for doctors

---

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/orders` | POST | Create new order |
| `/api/orders/[id]` | GET, PATCH | Fetch / update order |
| `/api/agent-settings` | GET, POST | Read/save agent settings + sync to ElevenLabs |
| `/api/elevenlabs/webhook` | POST | ElevenLabs calls this when agent can't answer — creates ai_ticket |
| `/api/elevenlabs/transfer` | POST | Returns transfer number for call transfer |
| `/api/twilio/voice` | POST | Twilio webhook — checks agent_enabled, routes to ElevenLabs or plays unavailable msg |
| `/api/portal/chat` | POST | Groq AI chat for doctor portal (fetches their orders as context) |
| `/api/calendar` | GET | Returns orders as FullCalendar events (pickup date, allDay) |
| `/api/lab/tickets/[id]` | PATCH | Mark AI ticket as resolved |

---

## Supabase tables

| Table | Key columns |
|-------|------------|
| `orders` | id, practice_id, doctor_id, patient_first_name, patient_last_name, patient_dob, product_id, tooth_numbers, colour_shade, case_status, case_start_date, estimated_pickup_date, order_date, notes, is_archived |
| `order_stage_history` | id, order_id, stage_name, changed_at, notes |
| `practices` | id, name, is_active |
| `doctors` | id, practice_id, first_name, last_name, email, portal_enabled |
| `products` | id, name, is_active, sort_order |
| `user_profiles` | id (= auth.uid), role |
| `ai_tickets` | id, tenant_id, phone_number, customer_name, task_type, task_name, question, status, created_at |
| `agent_settings` | id, tenant_id, agent_enabled, greeting_message, voice_id, office_location_url, office_hours, week_schedule (JSON text), updated_at |
| `tenants` | id, is_active |

### SQL needed for agent_settings week_schedule column (if not run yet)
```sql
alter table agent_settings add column if not exists week_schedule text;
```

---

## Environment variables (Vercel)

| Key | What it is |
|-----|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin client) |
| `GROQ_API_KEY` | Groq API key for doctor portal AI chat (free tier, llama-3.1-8b-instant) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_AGENT_ID` | `agent_6801ktwhgcdvfyq85nw58td4wwat` |
| `ELEVENLABS_AGENT_WEBHOOK_URL` | `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=agent_6801ktwhgcdvfyq85nw58td4wwat` |
| `ELEVENLABS_WEBHOOK_SECRET` | Optional secret header to verify ElevenLabs webhook calls |

---

## ElevenLabs / Twilio setup
- ElevenLabs agent ID: `agent_6801ktwhgcdvfyq85nw58td4wwat`
- Twilio phone number webhook → `https://dental-lab-seven.vercel.app/api/twilio/voice` (HTTP POST)
- When agent is ON: Twilio forwards call to ElevenLabs via WebSocket
- When agent is OFF: Twilio plays "unavailable" message and hangs up
- Call transfer number: `+19164600456`
- Agent tools in ElevenLabs: `create_ticket` (webhook) + Transfer to number (system tool via Twilio)

---

## Key components

| File | Purpose |
|------|---------|
| `components/lab/Sidebar.tsx` | Primary icon rail + sliding secondary sidebar |
| `components/portal/DoctorSidebar.tsx` | Doctor portal sidebar (same design as lab) |
| `components/portal/AskAIPanel.tsx` | AI chat panel with typewriter greeting |
| `components/lab/AdvanceButton.tsx` | Advance case stage button |
| `components/ui/StatusBadge.tsx` | Colored status pill |
| `components/ui/sign-in.tsx` | Animated login form |
| `hooks/useLiveDashboard.ts` | Client hook that polls Supabase every 10s for dashboard data |
| `app/(lab)/ai/AgentSettings.tsx` | Agent settings form (voice dropdown uses createPortal to avoid z-index clipping) |

---

## Case status stages (in order)
`Received` → `Prep Started` → `In Fabrication` → `Ready` → `Delivered`
Defined in `types/database.ts` as `STAGE_ORDER`.

---

## Important patterns
- Server components use `createServerClient()` from `@/lib/supabase/server`
- Client components use `createClient()` from `@/lib/supabase/client`
- Admin operations (webhook inserts) use `createAdminClient()` from `@/lib/supabase/admin`
- All `params` in Next.js 16 are `Promise<{...}>` — always `await params`
- Portal pages are doctor-only, gated by middleware checking `portal_enabled` on doctor row
- Lab pages are staff-only, gated by middleware checking `user_profiles.role`
