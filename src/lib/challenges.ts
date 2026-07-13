export type OutstandChallenge = {
  id: number;
  title: string;
  description: string;
  emoji: string;
  minutes: number;
  category: "Focus" | "Knowledge" | "Fitness" | "Mindset" | "Phone Detox" | "Productivity" | "Discipline" | "Social";
  difficulty: "Easy" | "Medium" | "Hard";
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  xp: number;
  theme: "Ocean" | "Forest" | "Galaxy" | "Sunset" | "Volcano" | "Royal" | "Ice" | "Neon" | "Sky";
  color: string;
};

// --- PREMIUM GAME VISUALS ---
export function getRarityStyle(rarity: OutstandChallenge["rarity"]) {
  switch (rarity) {
    case "Legendary":
      return {
        border: "border-yellow-500/80 hover:border-yellow-300 transition-colors duration-500",
        shadow: "shadow-[0_0_50px_rgba(234,179,8,0.6)] hover:shadow-[0_0_100px_rgba(253,224,71,1)] animate-pulse",
        text: "text-yellow-400 drop-shadow-[0_0_15px_rgba(253,224,71,0.9)] font-bold",
        bg: "bg-gradient-to-br from-yellow-500/20 to-black/80 hover:from-yellow-400/30 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out",
      };
    case "Epic":
      return {
        border: "border-purple-500/70 hover:border-purple-300 transition-colors duration-500",
        shadow: "shadow-[0_0_35px_rgba(168,85,247,0.4)] hover:shadow-[0_0_70px_rgba(216,180,254,0.9)]",
        text: "text-purple-400 drop-shadow-[0_0_10px_rgba(216,180,254,0.8)]",
        bg: "bg-gradient-to-br from-purple-600/20 to-black/80 hover:from-purple-500/30 transform hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 ease-out",
      };
    case "Rare":
      return {
        border: "border-blue-500/60 hover:border-blue-400 transition-colors duration-500",
        shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_45px_rgba(96,165,250,0.7)]",
        text: "text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]",
        bg: "bg-blue-500/10 hover:bg-blue-400/20 transform hover:scale-[1.02] transition-all duration-300 ease-out",
      };
    case "Uncommon":
      return {
        border: "border-emerald-500/50 hover:border-emerald-400 transition-colors duration-300",
        shadow: "shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10 hover:bg-emerald-400/15 transform hover:scale-[1.01] transition-all duration-300",
      };
    case "Common":
    default:
      return {
        border: "border-white/10 hover:border-white/30 transition-colors duration-300",
        shadow: "shadow-none hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        text: "text-slate-300",
        bg: "bg-white/5 hover:bg-white/10 transition-all duration-300",
      };
  }
}

// --- ALL 125 CHALLENGES ---
export const CHALLENGES: OutstandChallenge[] = [
  // Legendary (Massive XP, Hard)
  { id: 1, title: "Absolute Zero", description: "Turn your phone completely off. Put it in a drawer. Sit in silence and plan your next 5 years.", emoji: "🧊", minutes: 10, category: "Phone Detox", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Ice", color: "#38bdf8" },
  { id: 2, title: "The Spartan", description: "Hold a wall sit for as long as possible, then do pushups until the timer ends. No resting.", emoji: "⚔️", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Volcano", color: "#ef4444" },
  { id: 3, title: "Deep Architecture", description: "Write out the exact step-by-step roadmap for the biggest goal in your life right now.", emoji: "🏛️", minutes: 10, category: "Focus", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Royal", color: "#eab308" },
  { id: 31, title: "Monk Mode", description: "Stare at a single spot on the wall. Do not move a single muscle for the entire duration.", emoji: "🧘‍♂️", minutes: 10, category: "Discipline", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Galaxy", color: "#a855f7" },
  { id: 32, title: "Burpee Burnout", description: "Do as many burpees as humanly possible. Do not stop until you hear the alarm.", emoji: "🌋", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Volcano", color: "#ef4444" },
  { id: 61, title: "The Void", description: "Sit in a dark room in complete silence. No thoughts, no movement. Just exist.", emoji: "🕳️", minutes: 10, category: "Mindset", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Galaxy", color: "#a855f7" },
  { id: 62, title: "Max Out", description: "Do as many pull-ups or push-ups as you can until absolute muscular failure.", emoji: "🦍", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Volcano", color: "#ef4444" },
  { id: 91, title: "The Crucible", description: "Hold a plank until your core completely gives out. Rest for 10 seconds. Repeat until the timer ends.", emoji: "🛡️", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Volcano", color: "#ef4444" },
  { id: 92, title: "Ego Death", description: "Write down the biggest lie you are telling yourself right now, and exactly how you are going to fix it.", emoji: "👁️", minutes: 10, category: "Mindset", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Galaxy", color: "#a855f7" },
  { id: 93, title: "Total Disconnect", description: "Unplug your WiFi router and turn off mobile data. Sit in silence and strategize your week.", emoji: "🔌", minutes: 10, category: "Phone Detox", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Ice", color: "#38bdf8" },
  { id: 94, title: "Life Audit", description: "Rate your Health, Wealth, and Relationships on a scale of 1-10. Write a brutal plan to fix the lowest score.", emoji: "⚖️", minutes: 10, category: "Discipline", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Royal", color: "#eab308" },
  { id: 95, title: "The Marathon Mind", description: "Read a dense, difficult piece of philosophy or science for 10 minutes straight. Do not skip a single word.", emoji: "🧠", minutes: 10, category: "Knowledge", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Neon", color: "#c084fc" },
  
  // Epic (High XP, Medium/Hard)
  { id: 4, title: "Digital Purge", description: "Delete 5 apps you waste time on, then clear your recent photos of junk.", emoji: "🗑️", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 5, title: "Cold Exposure", description: "Wash your face with freezing cold water for 60 seconds, then meditate for the remaining 9 minutes.", emoji: "🥶", minutes: 10, category: "Mindset", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Ice", color: "#38bdf8" },
  { id: 6, title: "Velocity Reading", description: "Pick up a non-fiction book and read as fast as you can without losing comprehension.", emoji: "📖", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Galaxy", color: "#a855f7" },
  { id: 7, title: "Chaos Control", description: "Find the messiest room or area in your house. Clean it aggressively until the timer stops.", emoji: "🌪️", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Sunset", color: "#f97316" },
  { id: 33, title: "Social Blackout", description: "Delete your most used social media app. You cannot reinstall it for 24 hours.", emoji: "📵", minutes: 10, category: "Phone Detox", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 34, title: "Financial Audit", description: "Log into your bank. Write down exactly how much money you wasted this week.", emoji: "📉", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Royal", color: "#eab308" },
  { id: 35, title: "The Bold Pitch", description: "Send an email or message to someone out of your league asking for advice or an opportunity.", emoji: "🚀", minutes: 10, category: "Social", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Sky", color: "#38bdf8" },
  { id: 63, title: "Idea Machine", description: "Write down 20 completely new ideas for businesses, apps, or projects.", emoji: "💡", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 64, title: "The Hard Thing", description: "Identify the one task you are most afraid to do right now, and start it.", emoji: "💀", minutes: 10, category: "Discipline", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Royal", color: "#eab308" },
  { id: 65, title: "Zero Distraction", description: "Put your phone in another room. Work on your main project with zero background noise.", emoji: "🔕", minutes: 10, category: "Focus", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Ice", color: "#38bdf8" },
  { id: 66, title: "Cold Outreach", description: "Find someone who is 5 steps ahead of you in life and send them a cold message.", emoji: "🧊", minutes: 10, category: "Social", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Ocean", color: "#0ea5e9" },
  { id: 96, title: "Grayscale Mode", description: "Go into your phone settings and turn the screen to Black & White. Leave it like this for 24 hours.", emoji: "🔲", minutes: 10, category: "Phone Detox", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Sky", color: "#38bdf8" },
  { id: 97, title: "Fear Setting", description: "Write down the absolute worst-case scenario of taking a risk you've been avoiding. Then write how you'd survive it.", emoji: "⛈️", minutes: 10, category: "Mindset", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Sunset", color: "#f97316" },
  { id: 98, title: "Century Club", description: "Complete exactly 100 pushups. Take as many sets as you need, but do not stop until you hit 100.", emoji: "💯", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Volcano", color: "#ef4444" },
  { id: 99, title: "Inbox Annihilation", description: "Select all marketing emails and hit 'Delete'. Unsubscribe from at least 15 lists.", emoji: "💥", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Ocean", color: "#0ea5e9" },
  { id: 100, title: "The Hard Conversation", description: "Message someone you need to have a difficult conversation with and schedule a time to talk.", emoji: "🗣️", minutes: 10, category: "Social", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Royal", color: "#eab308" },
    { id: 101, title: "Zero Spend Pledge", description: "Lock your credit cards away. Commit to spending exactly $0 for the next 48 hours.", emoji: "🔒", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Forest", color: "#22c55e" },
  { id: 102, title: "Radical Honesty", description: "Write down 3 things you failed at recently. Analyze exactly why it was your own fault.", emoji: "🎯", minutes: 10, category: "Mindset", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Galaxy", color: "#a855f7" },
  { id: 103, title: "Deep Work Primer", description: "Put on noise-canceling headphones. Listen to brown noise. Outline your most complex project.", emoji: "🎧", minutes: 10, category: "Focus", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Ice", color: "#38bdf8" },
  { id: 104, title: "Delete the Feed", description: "Delete Instagram, TikTok, or Twitter from your phone. You can only use them on a desktop.", emoji: "✂️", minutes: 10, category: "Phone Detox", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 105, title: "Temperature Shock", description: "Take a freezing cold shower for exactly 3 minutes. Spend the rest of the time drying off and breathing.", emoji: "🚿", minutes: 10, category: "Mindset", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Ocean", color: "#0ea5e9" },
  { id: 106, title: "Vision Blueprint", description: "Draw out a visual map of what your ideal life looks like in exactly 3 years.", emoji: "🗺️", minutes: 10, category: "Mindset", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Royal", color: "#eab308" },
  { id: 107, title: "Posture Mastery", description: "Do 5 minutes of wall angels, followed by 5 minutes of deep hip flexor stretches.", emoji: "🧍‍♂️", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Sunset", color: "#f97316" },
  { id: 108, title: "Blind Typing", description: "Write 500 words on a topic without using the backspace key or stopping to edit.", emoji: "⌨️", minutes: 10, category: "Focus", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 109, title: "Brain Upgrade", description: "Watch a 10-minute tutorial on a technical skill you've been avoiding (coding, excel, video editing).", emoji: "⚙️", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Sky", color: "#38bdf8" },
  { id: 110, title: "Brutal Feedback", description: "Send your latest work to someone who will give you harsh, honest feedback. Do not defend yourself.", emoji: "📝", minutes: 10, category: "Social", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Volcano", color: "#ef4444" },
  { id: 111, title: "Time Audit", description: "Write down exactly how you spent every hour of the last 24 hours. Spot the wasted time.", emoji: "⏳", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Forest", color: "#22c55e" },
  { id: 112, title: "The Purge V2", description: "Fill an entire garbage bag with things you no longer need. Throw it out or donate it immediately.", emoji: "🗑️", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Galaxy", color: "#a855f7" },
  { id: 113, title: "Micro-Skill Acquisition", description: "Spend 10 minutes practicing a physical skill: juggling, a card trick, or pen spinning.", emoji: "🤹", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Ice", color: "#38bdf8" },
  { id: 114, title: "App Blockade", description: "Set up a screen time limit in your settings that locks you out of all social media after 30 mins a day.", emoji: "🧱", minutes: 10, category: "Phone Detox", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Royal", color: "#eab308" },
  { id: 115, title: "Value Creation", description: "Create something small but valuable in 10 minutes—a helpful tweet, a short guide, or a template.", emoji: "🛠️", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Sunset", color: "#f97316" },

  // Rare (Solid XP, Medium)
  { id: 8, title: "Core Crusher", description: "Alternate between 30 seconds of planks and 30 seconds of crunches.", emoji: "🔥", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Volcano", color: "#ef4444" },
  { id: 9, title: "Inbox Zero", description: "Clear out your unread emails. Unsubscribe from newsletters you never read.", emoji: "📬", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Ocean", color: "#0ea5e9" },
  { id: 10, title: "Future Self Journal", description: "Write a letter to yourself exactly 6 months from today. What do you hope you've achieved?", emoji: "✍️", minutes: 10, category: "Mindset", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Galaxy", color: "#a855f7" },
  { id: 11, title: "The Purge", description: "Find 3 items in your room to throw away or donate. Declutter your physical space.", emoji: "📦", minutes: 10, category: "Discipline", difficulty: "Easy", rarity: "Rare", xp: 60, theme: "Forest", color: "#22c55e" },
  { id: 12, title: "Brain Dump", description: "Write down every single task, worry, or idea in your head on a piece of paper.", emoji: "🧠", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Rare", xp: 60, theme: "Neon", color: "#c084fc" },
  { id: 13, title: "Blind Flight", description: "Turn on airplane mode. Do not turn it off until the 10 minutes are up.", emoji: "✈️", minutes: 10, category: "Phone Detox", difficulty: "Easy", rarity: "Rare", xp: 60, theme: "Sky", color: "#38bdf8" },
  { id: 36, title: "Shadow Boxing", description: "Non-stop shadow boxing. Keep your guard up and move your feet.", emoji: "🥊", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Volcano", color: "#ef4444" },
  { id: 37, title: "Concept Map", description: "Draw a mind map of a complex topic or skill you are currently trying to learn.", emoji: "🗺️", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Ocean", color: "#0ea5e9" },
  { id: 38, title: "Apology Tour", description: "Message someone you lost touch with or wronged. Clear the air.", emoji: "🕊️", minutes: 10, category: "Social", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Sunset", color: "#f97316" },
  { id: 39, title: "Mirror Talk", description: "Look yourself in the eyes in a mirror and speak your goals out loud with absolute conviction.", emoji: "🪞", minutes: 10, category: "Mindset", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Royal", color: "#eab308" },
  { id: 40, title: "Dopamine Fast", description: "No music, no screens, no reading, no talking. Just sit and let your brain reset.", emoji: "🔋", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Ice", color: "#38bdf8" },
  { id: 116, title: "Hydration Spike", description: "Drink 1 liter of water immediately. No excuses.", emoji: "🌊", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Ocean", color: "#0ea5e9" },
  { id: 117, title: "Task Triage", description: "Pick the 3 most critical tasks for the week. Ignore absolutely everything else.", emoji: "🏥", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Forest", color: "#22c55e" },
  { id: 118, title: "Screen Time Reality", description: "Open your screen time stats. Write down your total time and your most used app on a sticky note.", emoji: "📱", minutes: 10, category: "Phone Detox", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Sky", color: "#38bdf8" },
  { id: 119, title: "Micro-Workout", description: "Do 20 squats, 20 pushups, and 20 crunches as fast as humanly possible.", emoji: "⚡", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Volcano", color: "#ef4444" },
  { id: 120, title: "Dynamic Flow", description: "Follow a quick 10-minute yoga or dynamic stretching video on YouTube.", emoji: "🧘‍♀️", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Sunset", color: "#f97316" },
  { id: 121, title: "The 5-Minute Rule", description: "Pick a task you've been procrastinating. Force yourself to work on it for just 5 minutes.", emoji: "⏱️", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Neon", color: "#c084fc" },
  { id: 122, title: "Workspace Reset", description: "Remove every single item from your desk that is not essential to your current project.", emoji: "🧼", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Royal", color: "#eab308" },
  { id: 123, title: "The Why", description: "Write down the ultimate 'Why' behind your biggest goal. Why do you actually want it?", emoji: "❓", minutes: 10, category: "Mindset", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Galaxy", color: "#a855f7" },
  { id: 124, title: "Network Ping", description: "Send an interesting article or video to 3 friends with a note about why they'd like it.", emoji: "📡", minutes: 10, category: "Social", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Ocean", color: "#0ea5e9" },
  { id: 125, title: "Silent Walk", description: "Go for a walk without your phone, headphones, or a destination. Just observe.", emoji: "🚶‍♂️", minutes: 10, category: "Mindset", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Ice", color: "#38bdf8" },

  // Uncommon (Good XP, Easy/Medium)
  { id: 14, title: "Iron Legs", description: "Complete 40 bodyweight squats with perfect form, then stretch.", emoji: "🦵", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Forest", color: "#22c55e" },
  { id: 15, title: "Hydration Protocol", description: "Drink a large glass of water. Spend the rest of the time stretching your neck and back.", emoji: "💧", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Ocean", color: "#0ea5e9" },
  { id: 16, title: "Gratitude Log", description: "Write down 5 things you are genuinely grateful for right now.", emoji: "🙏", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Sunset", color: "#f97316" },
  { id: 17, title: "Desktop Sweep", description: "Clean up your computer's desktop and empty the trash/recycle bin.", emoji: "💻", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Neon", color: "#c084fc" },
  { id: 18, title: "Stair Climber", description: "Find a staircase and walk up and down continuously.", emoji: "🪜", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Volcano", color: "#ef4444" },
  { id: 19, title: "Text a Mentor", description: "Send a message to someone you look up to, thanking them or asking a smart question.", emoji: "📱", minutes: 10, category: "Social", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Royal", color: "#eab308" },
  { id: 20, title: "Language Sprint", description: "Spend 10 minutes learning 5 new words in a foreign language.", emoji: "🌍", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Galaxy", color: "#a855f7" },
  { id: 41, title: "Password Update", description: "Change the passwords for your 3 most important accounts to something secure.", emoji: "🔐", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Sky", color: "#38bdf8" },
  { id: 42, title: "Neck Release", description: "Do slow, deliberate neck stretches to reverse 'text neck'.", emoji: "🦒", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Forest", color: "#22c55e" },
  { id: 43, title: "Quote Hunt", description: "Find 3 quotes that inspire you and write them down on a physical sticky note.", emoji: "📌", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Sunset", color: "#f97316" },
  { id: 44, title: "Follow-up", description: "Reply to that one text or email you have been avoiding all week.", emoji: "✅", minutes: 10, category: "Social", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Ocean", color: "#0ea5e9" },
  { id: 45, title: "Speed Typist", description: "Take a 10-minute typing test online to improve your WPM (Words Per Minute).", emoji: "⌨️", minutes: 10, category: "Knowledge", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Neon", color: "#c084fc" },
  
  // Common (Base XP, Easy)
  { id: 21, title: "Deep Dive", description: "Study or work on one specific task. No tabs. No music with lyrics.", emoji: "🎯", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ocean", color: "#0ea5e9" },
  { id: 22, title: "Ghost Mode", description: "Put your phone out of sight and do not touch it.", emoji: "📵", minutes: 10, category: "Phone Detox", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ice", color: "#38bdf8" },
  { id: 23, title: "Mission Clean", description: "Organize your immediate workspace.", emoji: "🧹", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sunset", color: "#f97316" },
  { id: 24, title: "Mind Reset", description: "Sit still and focus only on the sensation of breathing.", emoji: "🧘", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Forest", color: "#22c55e" },
  { id: 25, title: "Sunlight Walk", description: "Walk outside without your phone. Just look at the horizon.", emoji: "☀️", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sunset", color: "#f97316" },
  { id: 26, title: "Posture Fix", description: "Do chest openers and touch your toes. Correct your posture.", emoji: "🧍", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ocean", color: "#0ea5e9" },
  { id: 27, title: "Podcast Snippet", description: "Listen to exactly 10 minutes of an educational podcast. Take one note.", emoji: "🎧", minutes: 10, category: "Knowledge", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Neon", color: "#c084fc" },
  { id: 28, title: "Wallet Audit", description: "Clean out your physical wallet or purse of old receipts.", emoji: "💳", minutes: 10, category: "Discipline", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Royal", color: "#eab308" },
  { id: 29, title: "Eye Rest", description: "Look at something at least 20 feet away to rest your eyes from screens.", emoji: "👁️", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Galaxy", color: "#a855f7" },
  { id: 30, title: "Quick Read", description: "Read a few pages of a book you've been putting off.", emoji: "📚", minutes: 10, category: "Knowledge", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Forest", color: "#22c55e" },
  { id: 46, title: "Glass of Water", description: "Drink one full glass of water right now.", emoji: "🚰", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ocean", color: "#0ea5e9" },
  { id: 47, title: "Notification Kill", description: "Turn off push notifications for one app that distracts you.", emoji: "🔕", minutes: 10, category: "Phone Detox", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sky", color: "#38bdf8" },
  { id: 48, title: "Junk Drawer", description: "Spend 10 minutes organizing one messy drawer in your house.", emoji: "🗄️", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sunset", color: "#f97316" },
  { id: 49, title: "Stand Up", description: "If you are sitting, stand up and pace for 10 minutes while thinking.", emoji: "🚶", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Forest", color: "#22c55e" },
  { id: 50, title: "Bed Maker", description: "Make your bed perfectly.", emoji: "🛏️", minutes: 10, category: "Discipline", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Royal", color: "#eab308" },
  { id: 51, title: "Documentary Intro", description: "Watch the first 10 minutes of a documentary on a topic you know nothing about.", emoji: "📺", minutes: 10, category: "Knowledge", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Galaxy", color: "#a855f7" },
  { id: 52, title: "Delete 10 Photos", description: "Go into your camera roll and delete 10 blurry or useless photos.", emoji: "🖼️", minutes: 10, category: "Discipline", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Neon", color: "#c084fc" },
  { id: 53, title: "Call Family", description: "Call a family member just to say hello and ask how their day is.", emoji: "📞", minutes: 10, category: "Social", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sunset", color: "#f97316" },
  { id: 54, title: "Wiki Rabbit Hole", description: "Hit 'Random Article' on Wikipedia and read it for 10 minutes.", emoji: "🌐", minutes: 10, category: "Knowledge", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sky", color: "#38bdf8" },
  { id: 55, title: "Just Breathe", description: "Do 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s) for 10 minutes.", emoji: "😮‍💨", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ice", color: "#38bdf8" },
  { id: 56, title: "Write a Review", description: "Leave a positive 5-star review for a small business or app you love.", emoji: "⭐", minutes: 10, category: "Social", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Royal", color: "#eab308" },
  { id: 57, title: "Shoulder Roll", description: "Do backwards shoulder rolls to relieve upper back tension.", emoji: "🔄", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Volcano", color: "#ef4444" },
  { id: 58, title: "Clear the Sink", description: "Wash whatever dishes are currently sitting in the sink.", emoji: "🍽️", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ocean", color: "#0ea5e9" },
  { id: 59, title: "Unfollow Spree", description: "Unfollow 5 accounts on social media that don't add value to your life.", emoji: "✂️", minutes: 10, category: "Phone Detox", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Neon", color: "#c084fc" },
  { id: 60, title: "Set Tomorrow", description: "Write down the #1 most important task you need to do tomorrow.", emoji: "📝", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Galaxy", color: "#a855f7" }
];

// --- LOGIC ---
export function randomChallenge(excludeTitle?: string): OutstandChallenge {
  const pool = excludeTitle
    ? CHALLENGES.filter((c) => c.title !== excludeTitle)
    : CHALLENGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function dailyChallenge(dateISO: string): OutstandChallenge {
  let h = 0;
  for (let i = 0; i < dateISO.length; i++) {
    h = (h * 31 + dateISO.charCodeAt(i)) >>> 0;
  }
  return CHALLENGES[h % CHALLENGES.length];
    }
   
