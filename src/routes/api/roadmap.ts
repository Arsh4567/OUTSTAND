import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const MODEL = "gemini-2.5-flash-lite";

const RequestSchema = z.object({
  mode: z.enum(["questions", "plan"]),
  category: z.string().min(1).max(80),
  answers: z.record(z.string(), z.unknown()).default({}),
  habits: z.array(z.object({ id: z.string(), name: z.string(), emoji: z.string().optional() })).max(30).default([]),
  context: z.object({ name: z.string().optional(), level: z.number().optional(), xp: z.number().optional(), streak: z.number().optional() }).optional(),
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function env(...names: string[]) {
  return names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim())?.trim();
}

function config() {
  return {
    url: env("SUPABASE_URL", "VITE_SUPABASE_URL"),
    key: env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
    gemini: env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"),
  };
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const { url, key } = config();
  if (!url || !key) return null;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getClaims(authorization.slice(7).trim());
  const userId = data?.claims?.sub;
  return error || typeof userId !== "string" ? null : { client, userId };
}

const categoryRules: Record<string, string> = {
  academics: "For academic or exam goals, ask for class/grade, board or curriculum if relevant, subjects, current level or recent marks, target percentage/grade, exam date or days available, daily realistic study availability, weak topics, strong topics, and preferred study style. Never invent a study duration before learning the student's available time. Break work into syllabus/topic-level actions.",
  fitness: "For fitness goals, ask for age if needed for safe tailoring, height, weight, training experience, goal type, available days, equipment/access, preferred activities, current ability, injuries or limitations, and realistic session duration. Do not prescribe extreme weight change, restrictive eating, unsafe exercise, or appearance-focused targets. Prioritize healthy performance and sustainable routines.",
  business: "For business or entrepreneurship goals, ask what they want to build, current stage, target outcome, customer/audience, available time, skills/resources, budget range if relevant, geography/market if relevant, constraints, and deadline. Convert the goal into concrete validation, execution, and review milestones.",
  money: "For money or earning goals, ask the exact outcome, time horizon, current situation, skills, available time, resources/budget, preferred legal/age-appropriate methods, and constraints. Do not promise income or recommend illegal, deceptive, gambling, or high-risk financial behavior. Build skill and execution milestones instead.",
  skill: "For learning a skill, ask the exact skill, current level, desired proficiency, deadline, days available, minutes per session, resources they already have, practice preferences, and how progress should be measured. Build progressive practice projects rather than generic hours of study.",
  content: "For YouTube, social media, editing, design, or creator goals, ask the exact outcome, platform, niche, current skill/audience, content format, publishing target, days available, time per session, tools/resources, and success metric. Build a production workflow with research, creation, publishing, analytics, and iteration.",
  sports: "For sports or chess goals, ask the sport/game, current level or rating, target level, deadline, days available, session duration, equipment/access, strengths, weaknesses, and recent performance. Build drills, practice blocks, review, and measurable checkpoints.",
  productivity: "For productivity, habits, focus, or lifestyle goals, ask the exact behavior/outcome, why it matters, current baseline, desired frequency, days available, common obstacles, environment, preferred difficulty, and how success will be measured. Build small repeatable actions and recovery rules rather than unrealistic schedules.",
  custom: "For any other goal, ask enough questions to identify the exact outcome, baseline, constraints, available days/time, difficulty preference, resources, risks or limitations, and measurable definition of success. Ask follow-ups whenever a missing answer materially changes the plan.",
};

const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["text", "number", "choice", "multiline"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

const PlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  durationDays: z.number().int().positive(),
  difficulty: z.string(),
  assumptions: z.array(z.string()).max(6),
  milestones: z.array(z.object({ day: z.number().int().positive(), title: z.string(), outcome: z.string(), actions: z.array(z.string()).min(1).max(6) })).min(1).max(20),
  today: z.array(z.string()).min(1).max(8),
  metrics: z.array(z.string()).min(1).max(8),
  adaptationRule: z.string(),
});

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI returned an invalid roadmap response.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export const Route = createFileRoute("/api/roadmap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await authenticate(request);
          if (!auth) return json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, 401);
          const body = await request.json().catch(() => null);
          const parsed = RequestSchema.safeParse(body);
          if (!parsed.success) return json({ error: "Invalid roadmap request.", code: "INVALID_PAYLOAD" }, 400);
          const { gemini } = config();
          if (!gemini) return json({ error: "AI service is not configured on the server.", code: "GEMINI_CONFIG_MISSING" }, 503);

          const google = createGoogleGenerativeAI({ apiKey: gemini });
          const rule = categoryRules[parsed.data.category] ?? categoryRules.custom;
          const habits = parsed.data.habits.map((habit) => `${habit.emoji ?? "•"} ${habit.name}`).join("\n") || "No habits selected yet.";
          const answers = JSON.stringify(parsed.data.answers, null, 2);
          const userName = parsed.data.context?.name ?? "the user";

          if (parsed.data.mode === "questions") {
            const prompt = `You are the planning interviewer inside OUTSTAND. Your job is NOT to make a generic plan yet. Ask only the questions needed to make a highly personalized roadmap for ${userName}.

Goal category: ${parsed.data.category}
Category-specific rules: ${rule}
Already selected habits, which are signals about what the user wants to work on:
${habits}
Answers already collected:
${answers}

Universal requirements:
- Always collect the exact goal/outcome.
- Always collect the number of days or a concrete deadline.
- Always collect a difficulty preference: gentle, balanced, or challenging.
- Ask only unanswered questions.
- Ask 1 to 3 high-value questions at a time, not a huge questionnaire.
- Questions must change the eventual plan. Avoid questions that are merely interesting.
- If the user says their goal is an exam percentage, you MUST collect class/grade, board/curriculum, target percentage, subjects, current level/marks, exam date or days available, and realistic daily availability before building the plan.
- If fitness, collect the safety-relevant and planning-relevant information described by the category rules before prescribing a routine.
- Never assume the user's available time. Never say something like "study math for 2 hours" until the user has told you their realistic availability.
- Return ONLY valid JSON with this exact shape: {"questions":[{"id":"...","question":"...","type":"text|number|choice|multiline","required":true,"options":["..."],"placeholder":"..."}]}
- Use concise, natural questions. Do not use markdown.`;
            const result = await generateText({ model: google(MODEL), prompt, maxOutputTokens: 900, maxRetries: 0 });
            const data = extractJson(result.text);
            const questions = z.array(QuestionSchema).parse(data.questions ?? []);
            return json({ questions });
          }

          const prompt = `You are the roadmap engine inside OUTSTAND. Build a genuinely personalized ${parsed.data.category} roadmap from the user's answers. This is not a generic productivity template.

Category rules:
${rule}

Selected habits:
${habits}

User answers:
${answers}

Non-negotiable planning rules:
- Respect the exact goal, deadline/duration, difficulty, baseline, constraints, and available time from the answers.
- Never invent missing facts. If something essential is still missing, return a concise "needsMoreInfo" response instead of guessing.
- Do not prescribe a generic "study X for 2 hours" plan. For academic goals, use the user's class/grade, board, target percentage, subjects, baseline, available days/time, weak areas, and exam date to determine topic-level actions and checkpoints.
- For fitness, keep the plan age-appropriate and health-focused. Do not prescribe extreme dieting, unsafe training, or aggressive weight-change targets.
- Use the selected habits as existing behavior signals and integrate them rather than duplicating them.
- Every action should be concrete and measurable.
- Make workload proportional to the user's stated availability and chosen difficulty.
- Include checkpoints where the plan should be adjusted from actual performance.
- Return ONLY valid JSON matching: {"title":string,"summary":string,"durationDays":number,"difficulty":string,"assumptions":string[],"milestones":[{"day":number,"title":string,"outcome":string,"actions":string[]}],"today":string[],"metrics":string[],"adaptationRule":string}`;
          const result = await generateText({ model: google(MODEL), prompt, maxOutputTokens: 1800, maxRetries: 0 });
          const plan = PlanSchema.parse(extractJson(result.text));
          return json({ plan });
        } catch (error) {
          console.error("Roadmap AI failed:", error);
          return json({ error: "The AI roadmap could not be generated. Please try again.", code: "ROADMAP_AI_FAILED" }, 500);
        }
      },
    },
  },
});
