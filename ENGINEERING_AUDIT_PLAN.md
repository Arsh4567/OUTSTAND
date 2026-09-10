# OUTSTAND Internal Engineering Audit Plan

## 1. Current Architecture
OUTSTAND is built on a modern, React-based edge computing stack:
- **Frontend:** React 19, TypeScript, TanStack Start, TanStack Router, Vite, Tailwind CSS 4.
- **Backend/State:** Supabase for authentication, PostgreSQL for persistent application data, and Edge Functions for heavy operations (AI, roadmaps, notifications).
- **Data Fetching:** TanStack Query combined with custom React hooks (`useRoadmap`, `useDashboard`, `useAppState`).
- **Real-time & AI Layer:** Vercel AI SDK streams responses from Supabase edge functions.

The architecture cleanly separates UI routes (`src/routes`), reusable components (`src/components`), custom data hooks (`src/hooks`), and serverless logic (`supabase/functions`).

---

## 2. Major Systems Deep-Dive
- **Stockfish Integration:** Highly robust. It successfully implements a Web Worker model using Blob URLs to bypass traditional asset loading issues, communicates asynchronously via the UCI protocol, manages request queues with sequence IDs, and gracefully handles termination to avoid memory leaks.
- **Notifications:** Built correctly. The permission request model correctly creates and stores VAPID keys. A Supabase pg_cron job (`dispatch-notification-jobs`) routinely triggers an edge function (`send-notification`) which intelligently factors in user settings like quiet hours and max limits before pushing payload to the Service Worker.
- **Roadmap Engine:** The core of the application. Driven by AI via Edge Functions, it intelligently gathers user constraints and context to construct a multi-day schema, storing the JSON-parsed output cleanly into relational Postgres tables (`roadmaps`, `roadmap_milestones`, `roadmap_tasks`).
- **Performance & PWA:** Outstanding visual flair using Three.js and Framer Motion. Uses `useReducedMotion` and dynamically checks device capabilities (`navigator.hardwareConcurrency`) to disable intensive WebGL rendering on low-power or mobile devices, ensuring consistent 60 FPS performance where it matters most.

---

## 3. Critical Bugs, Race Conditions, and Technical Debt
- **Missing `/api/chat` Route:** The `OutstandChatPanel.tsx` explicitly calls `/api/chat`. TanStack Start intercepts this expecting a server handler, but `src/routes/api/chat.ts` is entirely missing from the codebase. The assistant currently cannot stream unless this proxy/route is implemented or the frontend bypasses it to call Supabase Edge Functions directly.
- **Duplicated State Management:** There are completely duplicated hooks managing identical data models. Specifically, `src/hooks/useDashboard.ts` and `src/hooks/use-dashboard.ts` exist simultaneously.
- **Race Conditions in AI Edits:** The AI roadmap editing tools (`replace_tasks`, `update_goal`, `rename_roadmap`) mutate the database directly. If the user simultaneously updates a task in the UI, client-server state divergence is likely unless rigorous cache invalidation is performed instantly.

---

## 4. UI/UX Problems & Recommendations
- **Information Density vs. Cognitive Load:** While beautiful, the app is extremely dense. Users need a much faster path to "What should I do right now?"
- **Mobile Experience:** The 3D scenes (while scaled back on mobile) still consume screen real estate. The mobile UI needs a strictly card-based, bottom-sheet heavy design. Modal dialogs (like `RoadmapEditDialog`) should transition into Drawer/Sheet components on smaller screens to keep navigation thumb-friendly.
- **Dopamine & Gamification UX:** The UI needs more intuitive animations for streaks and XP. Gamification should feel secondary and rewarding, not complex.
- **Recommendation:** Implement a sticky "Focus Action Bar" at the bottom of the screen (especially on mobile) that gives a 1-tap route to the current daily execution task.

---

## 5. AI Assistant: Making It Truly Intelligent
Currently, the AI Assistant relies heavily on a generic `systemPrompt` and isolated tools. It feels like a chatbot stapled onto a productivity app rather than a deeply integrated coach.

To make it truly intelligent:
1. **Rich App Context Injection:** The assistant should immediately know what screen the user is on, what their last focus session was, and their current energy levels. We must inject `DashboardSnapshot`, `RoadmapExecutionSnapshot`, and recent `NightlyReview` data silently into the prompt stream on every request.
2. **Proactive Intervention:** Instead of waiting for the user to ask "What should I do?", the AI should proactively ping the chat panel if the `calculateRoadmapHealth` function returns `at_risk`.
3. **Deep App Navigation:** Give the AI tools to navigate the user around the app (e.g., `navigate_to_focus_mode`, `open_nightly_review`).
4. **Contextual Memory:** Utilize Supabase vector embeddings to store the user's past reflections. If a user says "I am struggling to study," the AI should query past reflections and say, "Last week, you mentioned the library was too noisy. Have you tried changing locations?"
5. **Seamless UI Execution:** The AI's responses should render interactive UI components (Generative UI) instead of markdown lists. E.g., if it breaks down a task, it should return a draggable checklist component directly inside the chat stream.

---

## 6. What Should Be Preserved
- The **Stockfish Web Worker** architecture.
- The **Push Notification Service Worker** infrastructure.
- The core **Supabase Database Schema** and strict RLS policies.
- The **Three.js/Framer Motion** degradation logic (`useReducedMotion`).
- The **Roadmap Data Model** (Milestones -> Tasks -> Progress).

---

## 7. What Should Be Refactored
- Consolidate duplicated hooks (`useDashboard.ts` vs `use-dashboard.ts`).
- Standardize the `tanstack/react-query` invalidation strategies so when AI alters a roadmap, the UI instantly reflects it without requiring a full hook reload.
- **AI Tooling System:** Refactor `supabase/functions/outstand-ai` to use Vercel AI SDK's new `generateObject` and structured tool-calling features more aggressively, supporting Generative UI payloads.

---

## 8. What Should Be Rebuilt
- **The Chat Implementation:** Rebuild the frontend chat panel (`OutstandChatPanel.tsx`) to properly route requests directly to the Supabase edge function or build the missing `src/routes/api/chat.ts` proxy. Include Generative UI support (using `ai/rsc` or custom tool call rendering).
- **Mobile Navigation:** Rebuild the mobile sidebar/header into a bottom navigation bar to maximize vertical space for execution tasks.

---

## 9. Dependencies Between Systems
- **Roadmap ↔ AI ↔ Chat:** The roadmap engine relies entirely on the AI Edge Function for generation and mutation. Chat relies on the AI to trigger roadmap updates.
- **Focus ↔ Dashboard ↔ Momentum:** Focus timer completions directly increment XP/Streaks, which instantly mutate Dashboard states.
- **Notifications ↔ Edge Functions:** The DB cron relies on the generic `send-notification` edge function, which must stay strictly decoupled from the UI.

---
**Prepared by:** Jules (Lead Architect)
