# Outstand

<div align="center">

### Turn focus into momentum.

**Outstand** is a premium productivity and habit-building experience built around focused work, daily consistency, gamification, and immersive interaction.

It combines a distraction-resistant focus workflow with XP, levels, streaks, daily missions, progress visualization, and cinematic UI to make productive behavior feel clear, rewarding, and repeatable.

<p>
  <a href="https://outstand-by-arsh.vercel.app"><strong>Live App</strong></a>
  ·
  <a href="https://github.com/Arsh4567/OUTSTAND/issues">Issues</a>
  ·
  <a href="https://github.com/Arsh4567/OUTSTAND/pulls">Pull Requests</a>
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

## Overview

Outstand is designed for people who want a stronger relationship with their attention.

Instead of treating productivity as a plain timer or checklist, the application turns progress into a visible system:

- Focus sessions become intentional missions.
- Completed habits contribute to XP and progression.
- Streaks provide a simple signal of consistency.
- The dashboard surfaces the next useful action instead of overwhelming users with information.
- Immersive visual effects and micro-interactions make important moments feel rewarding without turning the interface into noise.

The product is especially suited to students, creators, developers, and anyone building disciplined daily routines.

## Product Highlights

### Focus Mode

A focused workspace for completing a challenge without unnecessary distractions.

### Gamified Progress

Track XP, levels, streaks, daily missions, and completion progress so long-term consistency is easier to see.

### Personalized Dashboard

The dashboard greets users by their onboarding/sign-up name and acts as a personal command center for the day.

### My City

A visual progress layer that uses 3D rendering to turn growth into something users can see rather than only measure.

### Cinematic Interaction

Framer Motion and Three.js power carefully used transitions, portal effects, focus states, and reward moments.

### Cloud-Backed State

Supabase handles authentication and persistent user/productivity data, allowing progress to stay synchronized across sessions.

### Responsive Experience

The interface is designed to adapt across desktop and mobile layouts while keeping the primary actions obvious and accessible.

---

## Core Features

| Area | Capabilities |
| --- | --- |
| Authentication | Email/password authentication, Google sign-in, onboarding profile setup |
| Dashboard | Personalized greeting, XP, level, streak, daily missions, progress pulse, quick actions |
| Focus | Dedicated focus workflow, challenge generation, timers, completion states |
| Habits | Daily quests, completion tracking, XP rewards, optimistic UI updates |
| Progress | XP progression, levels, streaks, completion percentage, visual feedback |
| 3D Experience | Three.js-based city and portal effects |
| UX | Micro-animations, hover/tap states, loading states, toast feedback |
| Data | Supabase authentication, profile metadata, stats, daily quest persistence |
| Deployment | Vercel-ready production build |

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- TanStack Start / TanStack Router
- Vite
- Tailwind CSS 4
- Radix UI primitives
- Lucide React

### Motion & Visuals

- Framer Motion
- Motion
- Three.js
- React Three Fiber
- React Three Drei
- Custom WebGL / shader-based visual effects

### Backend & Data

- Supabase Auth
- Supabase database / realtime features
- Supabase JavaScript client

### Tooling

- ESLint
- Prettier
- TypeScript
- Bun / npm-compatible package workflows

### Deployment

- Vercel

---

## Architecture at a Glance

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
├── components/
│   ├── city/
│   ├── outstand/
│   ├── ai-elements/
│   └── ui/
├── hooks/
│   ├── use-auth.ts
│   ├── use-outstand.tsx
│   └── ...
├── lib/
│   ├── portal-effect.ts
│   └── ...
└── integrations/
    └── supabase/
```

The application keeps route-level product flows separate from reusable UI, hooks, and visual engines. This makes it easier to evolve the dashboard and focus experience independently.

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js 20+ or Bun
- A Supabase project
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Arsh4567/OUTSTAND.git
cd OUTSTAND
```

### 2. Install dependencies

Using Bun:

```bash
bun install
```

Or npm:

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file based on the variables used by your Supabase integration.

Typical client-side values include:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
```

> Never commit private keys, service-role keys, database passwords, or other secrets to the repository.

### 4. Start the development server

```bash
bun run dev
```

Or:

```bash
npm run dev
```

The local development server will expose the app through the Vite/TanStack Start workflow configured in the project.

---

## Available Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Create a production build |
| `bun run build:vercel` | Build with the Vercel Nitro preset |
| `bun run build:dev` | Build using development mode |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run format` | Format the project with Prettier |

If you use npm, replace `bun run` with `npm run`.

---

## Supabase Setup

Outstand relies on Supabase for authentication and persisted application state.

At a high level, the project uses Supabase for:

1. User authentication and profile metadata.
2. User progression and statistics.
3. Daily quest assignments and completion state.
4. Outstand/focus activity logging.
5. Realtime updates for selected dashboard data.

Your local Supabase project should match the schema and RPC functions expected by the application code.

---

## Deployment

The repository is configured for Vercel-oriented deployment.

A typical production flow is:

```text
GitHub push to main
        ↓
Vercel detects commit
        ↓
Install dependencies
        ↓
Production build
        ↓
Deploy
```

For deployment-specific guidance, see [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md).

---

## Performance Principles

Outstand intentionally uses animation as product feedback rather than decoration everywhere.

The project emphasizes:

- GPU-heavy effects only where they add meaningful value.
- Short, purposeful micro-interactions.
- Optimistic updates for responsive UI feedback.
- Reusable components instead of duplicated visual logic.
- Lazy or conditional rendering for immersive experiences.
- Responsive layouts that avoid unnecessary work on smaller screens.

When adding new visual effects, prefer a small number of high-quality interactions over many constantly running animations.

---

## Project Status

Outstand is an actively evolving project.

Current product areas include:

- Personalized onboarding
- Dashboard command center
- Focus / Outstand challenges
- Habit and XP progression
- Streak tracking
- 3D visual progress systems
- Immersive portal effects
- Supabase-backed persistence

Some advanced analytics, content systems, and additional integrations may continue to evolve as the product matures.

---

## Roadmap

Potential future improvements include:

- Deeper productivity analytics
- More configurable focus sessions
- Expanded achievement and reward systems
- Better historical progress views
- More interactive city/progress states
- Accessibility refinements
- Automated testing and stronger CI coverage
- Performance profiling across low-end mobile devices

---

## Contributing

Contributions, bug reports, and thoughtful product feedback are welcome.

Before opening a pull request:

1. Keep changes focused and easy to review.
2. Preserve existing product behavior unless the change intentionally updates it.
3. Run linting and a production build when possible.
4. Avoid committing secrets or generated local artifacts.
5. Include enough context in the pull request description for someone else to understand the change.

For larger changes, open an issue first so the direction can be discussed before implementation.

---

## Security

Please do not commit credentials or sensitive configuration to the repository.

If you discover a security issue, avoid posting exploitable details publicly. Contact the project maintainer privately so the issue can be investigated responsibly.

---

## License

This project is currently presented as an MIT-licensed project. See the repository license file for the authoritative license text.

---

<div align="center">

### Outstand

**Build focus. Stack consistency. Become someone you're proud of.**

Built by **Arsh**.

</div>
