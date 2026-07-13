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

// --- PREMIUM GAME VISUALS (Upgraded with crazy animations & glows) ---
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

// --- BATCH 1 & 2: 60 CHALLENGES ---
export const CHALLENGES: OutstandChallenge[] = [
  // Legendary (Massive XP, Hard)
  { id: 1, title: "Absolute Zero", description: "Turn your phone completely off. Put it in a drawer. Sit in silence and plan your next 5 years.", emoji: "🧊", minutes: 10, category: "Phone Detox", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Ice", color: "#38bdf8" },
  { id: 2, title: "The Spartan", description: "Hold a wall sit for as long as possible, then do pushups until the timer ends. No resting.", emoji: "⚔️", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Volcano", color: "#ef4444" },
  { id: 3, title: "Deep Architecture", description: "Write out the exact step-by-step roadmap for the biggest goal in your life right now.", emoji: "🏛️", minutes: 10, category: "Focus", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Royal", color: "#eab308" },
  { id: 31, title: "Monk Mode", description: "Stare at a single spot on the wall. Do not move a single muscle for the entire duration.", emoji: "🧘‍♂️", minutes: 10, category: "Discipline", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Galaxy", color: "#a855f7" },
  { id: 32, title: "Burpee Burnout", description: "Do as many burpees as humanly possible. Do not stop until you hear the alarm.", emoji: "🌋", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Volcano", color: "#ef4444" },
  
  // Epic (High XP, Medium/Hard)
  { id: 4, title: "Digital Purge", description: "Delete 5 apps you waste time on, then clear your recent photos of junk.", emoji: "🗑️", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 5, title: "Cold Exposure", description: "Wash your face with freezing cold water for 60 seconds, then meditate for the remaining 9 minutes.", emoji: "🥶", minutes: 10, category: "Mindset", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Ice", color: "#38bdf8" },
  { id: 6, title: "Velocity Reading", description: "Pick up a non-fiction book and read as fast as you can without losing comprehension.", emoji: "📖", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Galaxy", color: "#a855f7" },
  { id: 7, title: "Chaos Control", description: "Find the messiest room or area in your house. Clean it aggressively until the timer stops.", emoji: "🌪️", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Sunset", color: "#f97316" },
  { id: 33, title: "Social Blackout", description: "Delete your most used social media app. You cannot reinstall it for 24 hours.", emoji: "📵", minutes: 10, category: "Phone Detox", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 34, title: "Financial Audit", description: "Log into your bank. Write down exactly how much money you wasted this week.", emoji: "📉", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Royal", color: "#eab308" },
  { id: 35, title: "The Bold Pitch", description: "Send an email or message to someone out of your league asking for advice or an opportunity.", emoji: "🚀", minutes: 10, category: "Social", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Sky", color: "#38bdf8" },

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
  // --- BATCH 3: 30 NEW CHALLENGES (IDs 61-90) ---
  
  // Legendary (Massive XP, Hard)
  { id: 61, title: "The Void", description: "Sit in a dark room in complete silence. No thoughts, no movement. Just exist.", emoji: "🕳️", minutes: 10, category: "Mindset", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Galaxy", color: "#a855f7" },
  { id: 62, title: "Max Out", description: "Do as many pull-ups or push-ups as you can until absolute muscular failure.", emoji: "🦍", minutes: 10, category: "Fitness", difficulty: "Hard", rarity: "Legendary", xp: 150, theme: "Volcano", color: "#ef4444" },
  
  // Epic (High XP, Medium/Hard)
  { id: 63, title: "Idea Machine", description: "Write down 20 completely new ideas for businesses, apps, or projects.", emoji: "💡", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Neon", color: "#c084fc" },
  { id: 64, title: "The Hard Thing", description: "Identify the one task you are most afraid to do right now, and start it.", emoji: "💀", minutes: 10, category: "Discipline", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Royal", color: "#eab308" },
  { id: 65, title: "Zero Distraction", description: "Put your phone in another room. Work on your main project with zero background noise.", emoji: "🔕", minutes: 10, category: "Focus", difficulty: "Medium", rarity: "Epic", xp: 100, theme: "Ice", color: "#38bdf8" },
  { id: 66, title: "Cold Outreach", description: "Find someone who is 5 steps ahead of you in life and send them a cold message.", emoji: "🧊", minutes: 10, category: "Social", difficulty: "Hard", rarity: "Epic", xp: 100, theme: "Ocean", color: "#0ea5e9" },

  // Rare (Solid XP, Medium)
  { id: 67, title: "Financial Forecast", description: "Map out exactly where you want to be financially in 1 year and the math to get there.", emoji: "📈", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Forest", color: "#22c55e" },
  { id: 68, title: "Dead Hang", description: "Find a pull-up bar or ledge. Hang from it for as long as your grip can hold.", emoji: "🐒", minutes: 10, category: "Fitness", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Volcano", color: "#ef4444" },
  { id: 69, title: "Skill Deconstruction", description: "Pick a skill you want to learn. Write down the 3 smallest sub-skills to practice first.", emoji: "🔨", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Sky", color: "#38bdf8" },
  { id: 70, title: "Clean Slate", description: "Close every single open tab on your browser. Start entirely fresh.", emoji: "🧹", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Neon", color: "#c084fc" },
  { id: 71, title: "The Stoic Review", description: "Write down 3 things that went wrong today and how you will prevent them tomorrow.", emoji: "🏛️", minutes: 10, category: "Mindset", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Royal", color: "#eab308" },
  { id: 72, title: "Social Purge", description: "Mute or block 10 people whose content makes you feel negative or jealous.", emoji: "🚫", minutes: 10, category: "Phone Detox", difficulty: "Medium", rarity: "Rare", xp: 60, theme: "Sunset", color: "#f97316" },

  // Uncommon (Good XP, Easy/Medium)
  { id: 73, title: "Calf Burn", description: "Do 100 calf raises while standing in place.", emoji: "🦵", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Forest", color: "#22c55e" },
  { id: 74, title: "To-Do Triage", description: "Look at your to-do list. Delete or cross off the bottom 3 least important things.", emoji: "✂️", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Ocean", color: "#0ea5e9" },
  { id: 75, title: "Book Summary", description: "Read a quick summary of a famous book you haven't read yet.", emoji: "📑", minutes: 10, category: "Knowledge", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Galaxy", color: "#a855f7" },
  { id: 76, title: "Silent Meal", description: "Eat your next meal or snack in complete silence. No screens, no music.", emoji: "🍽️", minutes: 10, category: "Discipline", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Ice", color: "#38bdf8" },
  { id: 77, title: "Positive Reinforcement", description: "Send a text to a friend telling them why you appreciate them.", emoji: "💬", minutes: 10, category: "Social", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Sunset", color: "#f97316" },
  { id: 78, title: "Tension Release", description: "Spend 10 minutes stretching your hips and lower back.", emoji: "🧘", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Sky", color: "#38bdf8" },
  { id: 79, title: "Folder Organization", description: "Organize your messy 'Downloads' folder into proper subfolders.", emoji: "📁", minutes: 10, category: "Productivity", difficulty: "Medium", rarity: "Uncommon", xp: 35, theme: "Neon", color: "#c084fc" },
  { id: 80, title: "Focus Playlist", description: "Create a 10-track playlist of only instrumental music for deep work.", emoji: "🎵", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Uncommon", xp: 35, theme: "Royal", color: "#eab308" },

  // Common (Base XP, Easy)
  { id: 81, title: "Screen Wipe", description: "Clean your phone and computer screens. They are filthy.", emoji: "📱", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ocean", color: "#0ea5e9" },
  { id: 82, title: "Water Chug", description: "Drink 500ml of water right now without stopping.", emoji: "💧", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ice", color: "#38bdf8" },
  { id: 83, title: "Jumping Jacks", description: "Do 50 jumping jacks to get your blood flowing.", emoji: "🏃", minutes: 10, category: "Fitness", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Volcano", color: "#ef4444" },
  { id: 84, title: "Delete Spam", description: "Empty the spam folder and trash in your email.", emoji: "🗑️", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Neon", color: "#c084fc" },
  { id: 85, title: "Look Up", description: "Go outside and look at the sky for 2 minutes to reset your circadian rhythm.", emoji: "☁️", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sky", color: "#38bdf8" },
  { id: 86, title: "Read an Article", description: "Read one article on a topic completely outside your usual interests.", emoji: "📰", minutes: 10, category: "Knowledge", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Galaxy", color: "#a855f7" },
  { id: 87, title: "Fix Posture", description: "Sit up straight, pull your shoulders back, and take a deep breath.", emoji: "🪑", minutes: 10, category: "Discipline", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Forest", color: "#22c55e" },
  { id: 88, title: "Cable Management", description: "Untangle the charging cables on your desk or nightstand.", emoji: "🔌", minutes: 10, category: "Productivity", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Sunset", color: "#f97316" },
  { id: 89, title: "No Complaining", description: "Go the next 10 minutes without saying or thinking a single negative thing.", emoji: "🤐", minutes: 10, category: "Mindset", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Royal", color: "#eab308" },
  { id: 90, title: "Review Goals", description: "Read your top 3 goals for the year out loud.", emoji: "🎯", minutes: 10, category: "Focus", difficulty: "Easy", rarity: "Common", xp: 20, theme: "Ocean", color: "#0ea5e9" }
   
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
