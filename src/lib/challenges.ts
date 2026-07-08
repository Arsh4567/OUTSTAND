export type OutstandChallenge = {
  title: string;
  description: string;
  emoji: string;
  minutes: number;
  category: "focus" | "reading" | "movement" | "journaling" | "digital" | "space" | "planning";
};

export const CHALLENGES: OutstandChallenge[] = [
  {
    title: "10-Minute Focus Sprint",
    description:
      "Pick the single most important task on your list. Silence notifications, set a 10 minute timer, and work on nothing else until it rings.",
    emoji: "🎯",
    minutes: 10,
    category: "focus",
  },
  {
    title: "Speed Read One Chapter",
    description:
      "Open a book or article you've been putting off. Read for 10 minutes, then write one sentence summarizing the main idea.",
    emoji: "📖",
    minutes: 10,
    category: "reading",
  },
  {
    title: "Desk Reset",
    description:
      "Clear your entire desk. Throw away trash, put pens in one spot, and wipe the surface. A clean desk = a clean mind.",
    emoji: "🧹",
    minutes: 10,
    category: "space",
  },
  {
    title: "Stretch & Breathe",
    description:
      "Stand up. Roll your shoulders, stretch your neck, hips, and hamstrings. Finish with 20 slow deep breaths.",
    emoji: "🧘",
    minutes: 10,
    category: "movement",
  },
  {
    title: "Brain Dump Journal",
    description:
      "Grab a notebook. Write non-stop for 10 minutes about everything on your mind. Don't edit, don't judge, just release.",
    emoji: "📝",
    minutes: 10,
    category: "journaling",
  },
  {
    title: "No-Phone Challenge",
    description:
      "Put your phone in another room. For 10 minutes, do anything except look at a screen. Notice how it feels.",
    emoji: "📵",
    minutes: 10,
    category: "digital",
  },
  {
    title: "Tomorrow's Top 3",
    description:
      "Plan tomorrow. Write down the 3 most important things you must complete. Schedule them into time blocks.",
    emoji: "🗓️",
    minutes: 10,
    category: "planning",
  },
  {
    title: "Active Recall Quiz",
    description:
      "Pick a topic you studied recently. Close your notes. Write everything you remember for 10 minutes, then compare.",
    emoji: "🧠",
    minutes: 10,
    category: "focus",
  },
  {
    title: "Walk Without Headphones",
    description:
      "Step outside and walk for 10 minutes with no music or podcast. Notice sounds, light, and your own thoughts.",
    emoji: "🚶",
    minutes: 10,
    category: "movement",
  },
  {
    title: "Inbox Zero Blitz",
    description:
      "Open your email. Delete, archive, or reply to as many as possible in 10 minutes. Speed matters more than perfection.",
    emoji: "📬",
    minutes: 10,
    category: "planning",
  },
  {
    title: "Gratitude Three",
    description:
      "Write down 3 specific things you're grateful for today. Be concrete: not 'friends' but 'the way X made me laugh at lunch.'",
    emoji: "🌟",
    minutes: 10,
    category: "journaling",
  },
  {
    title: "Teach It Back",
    description:
      "Pick a concept you learned this week. Explain it out loud as if teaching a 12-year-old. Notice the gaps.",
    emoji: "👨‍🏫",
    minutes: 10,
    category: "focus",
  },
  {
    title: "Hydrate + Reset",
    description:
      "Drink a full glass of water. Wash your face. Do 20 jumping jacks. Sit back down ready to work.",
    emoji: "💧",
    minutes: 10,
    category: "movement",
  },
  {
    title: "Digital Declutter",
    description:
      "Delete 10 apps you don't use, clear your desktop, and organize your downloads folder. Digital space matters.",
    emoji: "🗂️",
    minutes: 10,
    category: "digital",
  },
  {
    title: "Weekly Reflection",
    description:
      "Answer three questions: What went well? What drained me? What will I change next week?",
    emoji: "🔍",
    minutes: 10,
    category: "journaling",
  },
  {
    title: "One Hard Message",
    description:
      "Send that one message you've been avoiding. An email to a professor, a reply to a friend, a follow-up. Just send it.",
    emoji: "✉️",
    minutes: 10,
    category: "planning",
  },
];

export function randomChallenge(exclude?: string): OutstandChallenge {
  const pool = exclude ? CHALLENGES.filter((c) => c.title !== exclude) : CHALLENGES;
  return pool[Math.floor(Math.random() * pool.length)];
}
