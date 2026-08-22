<div align="center">

# OUTSTAND

### Turn attention into momentum.

**An AI-powered productivity system that turns goals into daily execution.**

<p>
  <a href="https://outstand-by-arsh.vercel.app"><strong>Launch OUTSTAND ↗</strong></a>
  ·
  <a href="https://github.com/Arsh4567/OUTSTAND/issues">Report an issue</a>
  ·
  <a href="https://github.com/Arsh4567/OUTSTAND/pulls">Contribute</a>
</p>

<p>
  <img src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TanStack%20Start-1.x-ff4154?style=for-the-badge" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4.x-06b6d4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

</div>

---

## What is OUTSTAND?

OUTSTAND is built around one idea:

> **Don't just plan your goals. Execute them every day.**

Instead of another generic to-do list, OUTSTAND connects goals, schedules, focus sessions, habits, progress, reflection, and AI into one execution loop.

The product takes a user's goal and turns it into **specific work for today**, then uses what actually happened to improve the plan for tomorrow.

```text
Goal
  ↓
AI roadmap
  ↓
Timed daily blocks
  ↓
Focused execution
  ↓
Completion + real activity
  ↓
Nightly reflection
  ↓
A better tomorrow
```

---

## Core experience

### 🧠 AI Roadmaps

Build a roadmap around what you're actually trying to achieve: skill learning, academics, exam preparation, chess, fitness, content creation, business, or productivity.

OUTSTAND gathers context such as your starting point and availability, then generates a structured plan with milestones and daily execution blocks.

Roadmaps are not static documents. Users can:

- Edit their roadmap directly.
- Ask AI to change the roadmap using natural-language requests.
- See today's progress and the next task.
- Review the day and let AI adapt the next schedule.
- Work through learning milestones and quizzes when the generated roadmap includes them.

### ⏱️ Daily execution

The roadmap is designed around **time-boxed work**, not an endless list of vague tasks. Daily blocks can include start time, end time, estimated duration, instructions, and a clear completion state.

### 🎯 Focus

A dedicated focus experience gives users a place to protect attention and complete a work block without turning the whole product into a complicated dashboard.

### 📊 A useful dashboard

The dashboard is centered on what matters today: personalized context, habits, focus activity, progress, and a clear **Right now** action. Recent activity is derived from actual habits, focus sessions, Outstand activity, and the daily score.

### 🌙 Nightly review

At the end of the day, users can reflect on what happened, report energy and difficulty, and let OUTSTAND adapt tomorrow's schedule.

### 🔁 Momentum loop

OUTSTAND keeps progress visible through completion, XP, levels, streaks, and productivity signals while keeping the primary goal simple:

**Make the next useful action obvious.**

---

## Product surface

| Experience | Purpose |
| --- | --- |
| **Dashboard** | Daily command center with real productivity signals, habits, focus activity, momentum, and the next best action |
| **Roadmap** | Goal → milestones → timed daily execution plan |
| **AI Roadmap Editing** | Change an existing roadmap by describing what should be different |
| **Daily Focus** | See and complete today's planned work blocks |
| **Focus** | Dedicated focused-work experience |
| **Habits** | Repeatable daily actions and completion tracking |
| **Progress & Momentum** | XP, levels, streaks, completion, and productivity signals |
| **Nightly Review** | Reflect on the day and adapt tomorrow |
| **Learning Milestones** | Structured milestone content and optional quizzes inside roadmaps |
| **Authentication** | User accounts and persistent personal data via Supabase |
| **AI Layer** | AI generation and assistant-oriented infrastructure |

---

## Architecture

```text
                         ┌─────────────────────┐
                         │       OUTSTAND      │
                         │  Goal → Execution   │
                         └──────────┬──────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
    ROADMAP ENGINE            DAILY EXECUTION          MOMENTUM SYSTEM
          │                         │                         │
   Goal + context             Timed tasks               Habits
   AI generation              Daily focus               XP / levels
   Milestones                 Completion                Streaks
   AI editing                 Reflection                Activity
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
                              LEARNING LOOP
                                    │
                            Today's results
                                    ↓
                              Nightly review
                                    ↓
                           Tomorrow's schedule
```

The codebase separates route-level experiences from reusable components, hooks, Supabase integrations, and AI/API handlers. Roadmap functionality is split into dedicated onboarding, visualization, daily-focus, task-list, editing, and nightly-review components.

---

## Tech stack

### Frontend

- **React 19**
- **TypeScript**
- **TanStack Start**
- **TanStack Router**
- **Vite**
- **Tailwind CSS 4**
- **Radix UI**
- **Lucide React**
- **Framer Motion / Motion**

### Data & infrastructure

- **Supabase** — authentication and persistent application data
- **TanStack Query** — client-side data fetching and caching
- **Zod** — validation
- **React Hook Form** — forms
- **Vercel** — deployment

### AI & rich interaction

- **Vercel AI SDK ecosystem**
- **Google AI SDK**
- **Groq AI SDK**
- **OpenAI-compatible AI providers**
- **CopilotKit UI infrastructure**
- **React Markdown / Streamdown**

### Visual systems

- **Three.js**
- **React Three Fiber**
- **React Three Drei**
- **Framer Motion / Motion**

The authoritative dependency list lives in [`package.json`](./package.json).

---

## Repository structure

```text
src/
├── routes/
│   ├── auth.tsx
│   ├── index.tsx
│   ├── roadmap.tsx
│   └── _authenticated/
│       └── dashboard.tsx
│
├── components/
│   ├── dashboard/
│   ├── roadmap/
│   ├── ai-elements/
│   └── ui/
│
├── hooks/
│   ├── use-roadmap.ts
│   ├── useDashboard.ts
│   ├── use-auth.ts
│   └── ...
│
├── integrations/
│   └── supabase/
│
└── lib/
```

---

## Quick start

### Prerequisites

- Node.js 20+ or Bun
- A Supabase project
- Git

### 1. Clone

```bash
git clone https://github.com/Arsh4567/OUTSTAND.git
cd OUTSTAND
```

### 2. Install dependencies

```bash
bun install
```

Or:

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file using the Supabase values expected by the application.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> Never commit service-role keys, database passwords, private tokens, or other secrets.

### 4. Start the dev server

```bash
bun run dev
```

Or:

```bash
npm run dev
```

---

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Production build |
| `bun run build:vercel` | Vercel/Nitro production build |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript checks |
| `bun run format` | Format the repository with Prettier |

---

## Supabase

Supabase is a core part of OUTSTAND's application architecture.

It is used for authentication and persistent user/product state. Roadmap changes are saved to the database and reloaded after updates so the product remains stateful across sessions.

For local development, make sure your Supabase project contains the tables, policies, RPCs, and environment configuration expected by the application.

---

## Product principles

### 01 — Make the next action obvious

A productivity app should answer **"What should I do right now?"** before it shows everything else.

### 02 — Plans should adapt to reality

The schedule should change when real life changes. Completion and nightly reflection feed back into tomorrow's plan.

### 03 — Progress must be tangible

Habits, focus sessions, completion, streaks, XP, and daily signals turn progress into something users can actually see.

### 04 — AI should edit the system, not just chat

AI is most useful when it can make concrete changes to a user's plan and workflow, not only return another paragraph of advice.

### 05 — Premium does not mean noisy

Motion, visual effects, and polish should make state changes clearer without distracting from the work.

### 06 — Real data over fake activity

Product surfaces should represent the user's actual behavior whenever possible.

---

## Project status

OUTSTAND is an actively evolving product.

The current codebase already contains a substantial foundation for:

- AI-generated goal roadmaps
- Timed daily schedules
- Roadmap editing and AI-powered roadmap changes
- Daily task execution
- Nightly reflection and schedule adaptation
- Personalized dashboard intelligence
- Habit tracking
- Focus sessions
- Progress, XP, levels, and streaks
- Supabase-backed authentication and persistence
- AI integrations and streaming-oriented UI infrastructure
- Responsive, motion-rich product interfaces

The product direction is moving toward a tighter loop:

> **Decide → Schedule → Focus → Complete → Reflect → Adapt → Repeat**

---

## Roadmap direction

The implementation roadmap will continue to evolve, but the product direction is focused on making OUTSTAND more useful every day rather than simply adding more screens.

Planned areas include:

- More adjustable focus workflows and controls
- Stronger productivity analytics and real recent activity
- A more useful dopamine / digital-friction experience
- Better light-theme parity without losing the premium feel
- Deeper AI assistance across the product
- Stronger social and accountability features
- More adaptive academic and syllabus planning
- More polished onboarding, accessibility, and performance

---

## Contributing

Thoughtful engineering and product feedback are welcome.

Before opening a pull request:

1. Keep changes focused and explain why they matter.
2. Preserve existing behavior unless the change intentionally modifies it.
3. Run `bun run lint` and `bun run typecheck` where applicable.
4. Run a production build for routing, rendering, deployment, or shared-infrastructure changes.
5. Never commit secrets or generated local artifacts.

For larger product changes, opening an issue first can make implementation and review smoother.

---

## Security

Never publish credentials, private keys, service-role secrets, database passwords, or sensitive configuration.

For security-sensitive issues, use a private disclosure route rather than posting exploitable details publicly.

---

## License

See the repository's license file for the authoritative licensing terms.

---

<div align="center">

### OUTSTAND

**Focus with intention. Execute with consistency. Keep moving.**

Built by **Arsh**.

</div>
