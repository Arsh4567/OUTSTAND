# Plan: Native AI Chat Assistant

## Overview
Build a floating AI chat assistant named `ChatAssistant.tsx` that opens in a mobile-friendly bottom drawer. It will connect to Lovable AI Gateway, persist the single conversation in Lovable Cloud, and read your Outstand app data (habits, focus sessions, dopamine score, streak, XP) to give personalized coaching.

## What will be built

### 1. Dependencies
Install the AI SDK and Lovable AI Elements primitives:
- `ai`, `@ai-sdk/react` — streaming chat UI transport
- `@ai-sdk/openai-compatible` — Lovable AI Gateway adapter
- `ai-elements` — standard React chat primitives (Conversation, Message, PromptInput, Shimmer)
- `react-markdown` — render assistant markdown responses

### 2. Lovable AI Gateway helper
Create `src/lib/ai-gateway.server.ts` with the documented `createLovableAiGatewayProvider` helper so the server route can call `streamText` through the gateway using `openai/gpt-5.5`.

### 3. Database schema (single conversation)
Create a migration for two tables:
- `chat_conversations` — one row per user
- `chat_messages` — all turns tied to that conversation

Both tables will have RLS policies so users can only read/write their own rows, plus standard `created_at`/`updated_at` and GRANTs.

### 4. Streaming server route
Create `src/routes/api/chat.ts`:
- Verify the Supabase bearer token from the request header.
- Load the user’s single conversation, or create one if missing.
- Build a system prompt that injects the Outstand app context passed from the client (habits, sessions, outstand completions, XP, best streak, dopamine score).
- Call `streamText` with `openai/gpt-5.5` and return `toUIMessageStreamResponse`.
- Persist the user message and the completed assistant message in `onFinish`.
- Surface gateway errors (rate limits, credit exhaustion) clearly.

### 5. ChatAssistant.tsx component
Create `src/components/chat-assistant.tsx`:
- Floating action button in the bottom-right corner with a gradient icon that matches the app’s glow styling.
- Click opens a shadcn/ui `Drawer` sliding up from the bottom (mobile-friendly drag handle, full-height on mobile).
- Inside the drawer: header, scrollable AI Elements chat transcript, composer, and loading shimmer.
- Use `useChat` + `DefaultChatTransport` pointing to `/api/chat`.
- Load the existing conversation from the server on first open.
- Send the current Outstand app context with every chat request so the AI can coach based on today’s habits, focus, and dopamine score.
- Render assistant messages with markdown.
- Disable send while streaming, keep the textarea focused, and auto-scroll to the latest message.
- Include a “New chat” action that clears the conversation history server-side.

### 6. App integration
Render `<ChatAssistant />` inside `ShellWithChrome` so it appears on every authenticated page. It will be hidden on the landing/auth routes where the shell is not rendered.

### 7. Verification
- Run the typecheck/build to catch import or type errors.
- Verify the `/api/chat` route responds to a test message.
- Confirm the drawer opens/closes, messages stream, and the FAB is visible on authenticated pages.

## Technical choices
- **Single conversation + database**: matches your answers; one ongoing chat per user persisted across sessions.
- **AI Elements + shadcn/ui**: standard React components, no third-party widget.
- **App context sent from client**: habits, focus, and dopamine data live in browser localStorage in this app, so the client will collect it and pass it to the server route for the system prompt.
- **Default model**: `openai/gpt-5.5` (Lovable AI default) unless you prefer a different one.