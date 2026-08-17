<div align="center">

# OUTSTAND

### Turn attention into momentum.

**A cinematic productivity system for focus, consistency, and meaningful progress.**

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
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4.x-06b6d4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

</div>

---

## The idea

Most productivity tools are built around lists, timers, and reminders.

**OUTSTAND is built around momentum.**

It turns focused work and daily habits into a visible progression loop: complete meaningful actions, earn XP, maintain streaks, advance through levels, and watch your progress become tangible.

The goal is not to make productivity feel like a game for the sake of gaming. The goal is to make **good behavior easier to see, easier to repeat, and more rewarding to sustain.**

> **Focus → Complete → Earn → Progress → Repeat**

---

## Why OUTSTAND feels different

### 🎯 Focus over friction

A dedicated focus experience keeps the next useful action front and center instead of turning productivity into dashboard archaeology.

### ⚡ Progress you can feel

XP, levels, streaks, missions, completion states, and visual feedback make consistency visible instead of abstract.

### 🌆 Your progress has a world

**My City** transforms progression into a 3D visual layer, giving users something more memorable than another percentage bar.

### ✨ Motion with purpose

Animations, portal transitions, hover states, loading feedback, and reward moments are designed to reinforce state changes—not compete with the task.

### ☁️ Built around persistent state

Authentication and application data are backed by Supabase so a user's progress can survive sessions and stay synchronized with the product.

### 📱 Designed for the real world

Responsive layouts and clear primary actions keep the experience useful across desktop and mobile screens.

---

## Product surface

| Experience | What it does |
| --- | --- |
| **Dashboard** | Personalized home base for XP, levels, streaks, missions, progress, and quick actions |
| **Focus** | Dedicated workflow for focused challenges and completion states |
| **Outstand** | Challenge-driven productivity flow connected to the dashboard experience |
| **Habits & Quests** | Daily actions, completion tracking, and XP rewards |
| **Progression** | Levels, streaks, completion signals, and visual reinforcement |
| **My City** | 3D progress visualization built with Three.js / React Three Fiber |
| **Immersive UI** | Portal effects, transitions, micro-interactions, toasts, and visual feedback |
| **Authentication** | Supabase-backed sign-in, onboarding, and profile state |
| **AI Layer** | AI SDK integrations and assistant-oriented UI infrastructure already present in the stack |

---

## Experience architecture

```text
                    ┌─────────────────────┐
                    │       OUTSTAND      │
                    │   Personal system   │
                    │     for momentum    │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
     FOCUS LOOP          PROGRESS LOOP        WORLD LOOP
          │                    │                    │
   Missions / Focus      XP / Levels /       My City / 3D
   Completion states     Streaks / Quests   Visual feedback
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                      Consistent daily action
```

The codebase follows the same product philosophy: route-level flows are separated from reusable UI, hooks, integrations, and specialized visual engines.

---

## Tech stack

### Core

- **React 19** — component-driven UI
- **TypeScript** — type-safe application code
- **TanStack Start** — full-stack React application framework
- **TanStack Router** — route and navigation architecture
- **Vite** — development and build tooling
- **Tailwind CSS 4** — utility-first styling
- **Radix UI** — accessible UI primitives
- **Lucide React** — iconography

### Motion & 3D

- **Framer Motion / Motion** — product motion and interaction states
- **Three.js** — 3D rendering
- **React Three Fiber** — React renderer for Three.js
- **React Three Drei** — reusable 3D helpers
- **Canvas / shader-style effects** — immersive visual layers

### Data & product infrastructure

- **Supabase Auth** — authentication
- **Supabase** — persistent application state and backend services
- **TanStack Query** — client-side data fetching and caching
- **Zod** — runtime validation
- **React Hook Form** — structured form state

### AI & interactive systems

- **Vercel AI SDK ecosystem**
- **Google / Groq / OpenAI-compatible AI providers**
- **CopilotKit UI infrastructure**
- **Markdown, code, math, and streaming-oriented rendering support**

### Deployment

- **Vercel** — production deployment

_Source of truth for the stack: [`package.json`](./package.json)._ 

---

## Repository structure

```text
src/
├── routes/
│   ├── auth.tsx
│   └── _authenticated/
│       ├── dashboard.tsx
│       ├── onboarding.tsx
│       ├── outstand.tsx
│       ├── focus.tsx
│       └── ...
│
├── components/
│   ├── city/
│   ├── outstand/
│   ├── ai-elements/
│   └── ui/
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-outstand.tsx
│   └── ...
│
├── lib/
│   ├── portal-effect.ts
│   └── ...
│
└── integrations/
    └── supabase/
```

This separation keeps product experiences, reusable components, application hooks, backend integrations, and visual effects maintainable as OUTSTAND grows.

---

## Quick start

### Prerequisites

- Node.js 20+ **or** Bun
- A Supabase project
- Git

### 1. Clone

```bash
git clone https://github.com/Arsh4567/OUTSTAND.git
cd OUTSTAND
```

### 2. Install

```bash
bun install
```

Or:

```bash
npm install
```

### 3. Configure environment

Create a local environment file with the Supabase values expected by the application.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> **Security:** never commit service-role keys, database passwords, private tokens, or other secrets.

### 4. Run locally

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
| `bun run build` | Create a production build |
| `bun run build:vercel` | Build with the Vercel Nitro preset |
| `bun run build:dev` | Build in development mode |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript checks |
| `bun run format` | Format the repository with Prettier |

Using npm? Replace `bun run` with `npm run`.

---

## Supabase

OUTSTAND uses Supabase as a core part of its product architecture.

The application uses the backend for authentication and persisted product state, including progression-oriented data and user-specific activity.

For local development, make sure your Supabase project matches the tables, policies, RPCs, and server/client expectations referenced by the application code.

---

## Deployment

OUTSTAND is configured for **Vercel + TanStack Start** deployment.

```text
Git push
   ↓
Vercel detects commit
   ↓
Install dependencies
   ↓
bun run build:vercel
   ↓
TanStack Start server output
   ↓
Production deployment
```

For the repository's exact deployment requirements, read [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md).

The current deployment flow specifically accounts for server-rendered routes and refreshes on protected pages; Vercel should build the TanStack Start server output rather than treating the app as a static SPA.

---

## Design principles

### 01 — Product clarity

Every screen should make the next useful action obvious.

### 02 — Motion as feedback

Animation should explain state, reward completion, or guide attention—not create noise.

### 03 — Progress should be tangible

Numbers matter, but memorable visual feedback helps users understand momentum.

### 04 — Optimistic interaction

When safe, interfaces should acknowledge user intent immediately and synchronize persistent state afterward.

### 05 — Responsive by default

A premium experience should survive narrow screens, touch interactions, and less powerful hardware.

### 06 — Build for maintainability

Reusable components, focused hooks, typed data boundaries, and clear route structure matter as much as visual polish.

---

## Performance mindset

OUTSTAND uses rich motion and 3D rendering, so performance is treated as part of the product experience.

When extending the app, prefer:

- Purposeful animation over continuously running effects.
- Conditional or lazy rendering for expensive visual experiences.
- Reusable primitives over duplicated visual logic.
- Small, efficient data flows over unnecessary client work.
- Responsive behavior that respects lower-powered devices.
- Profiling before optimizing based on assumptions.

**Premium UI should still feel fast.**

---

## Project status

OUTSTAND is an actively evolving product and codebase.

The repository currently contains a substantial foundation across:

- Authentication and onboarding
- Personalized dashboard experiences
- Focus and Outstand workflows
- Habit / quest progression
- XP, levels, and streak-oriented state
- 3D city and immersive visual systems
- Supabase-backed persistence
- AI-oriented UI and SDK infrastructure
- Vercel deployment configuration

The product is intentionally being built as a system that can expand without losing its core identity: **clear action, visible progress, and momentum.**

---

## Roadmap direction

The exact roadmap will evolve with the product, but the north-star direction includes:

- Deeper productivity analytics and history
- More flexible focus workflows
- Richer achievements and reward systems
- More expressive city/progression states
- Stronger accessibility coverage
- Automated tests and broader CI confidence
- Performance profiling across lower-end mobile hardware
- More capable AI-assisted productivity workflows

---

## Contributing

OUTSTAND is open to thoughtful engineering and product feedback.

Before opening a pull request:

1. Keep the change focused.
2. Preserve existing behavior unless the change intentionally modifies it.
3. Run `bun run lint` and `bun run typecheck` where applicable.
4. Run a production build for changes that affect routing, rendering, deployment, or shared infrastructure.
5. Never commit secrets or generated local artifacts.
6. Explain **why** the change matters, not only what files changed.

For large product changes, an issue or design discussion first can make implementation and review much smoother.

---

## Security

Never publish credentials, private keys, service-role secrets, database passwords, or other sensitive configuration.

For security-sensitive issues, use a private disclosure route rather than posting exploitable details publicly.

---

## License

See the repository's license file for the authoritative licensing terms.

---

<div align="center">

### OUTSTAND

**Focus with intention. Build with consistency. Become someone you're proud of.**

Built by **Arsh**.

</div>
