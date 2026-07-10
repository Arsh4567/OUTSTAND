export interface OutstandMission {
  id: number;
  title: string;
  description: string;
  category:
    | "Focus"
    | "Phone Detox"
    | "Fitness"
    | "Mindset"
    | "Productivity"
    | "Knowledge"
    | "Discipline"
    | "Social"
    | "Legendary";
  difficulty: "Easy" | "Medium" | "Hard";
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  xp: number;
  duration: number;
  color: string;
  icon: string;
  theme:
    | "Ocean"
    | "Forest"
    | "Galaxy"
    | "Sunset"
    | "Neon"
    | "Royal"
    | "Volcano"
    | "Ice";
}

export const outstandMissions: OutstandMission[] = [
  {
id:1,
title:"Deep Dive",
description:"Study one subject with complete focus for 10 minutes.",
category:"Focus",
difficulty:"Easy",
rarity:"Common",
xp:20,
duration:10,
color:"#FFFFFF",
icon:"📚",
theme:"Ocean"
},

{
id:2,
title:"Ghost Mode",
description:"Keep your phone in another room for 15 minutes.",
category:"Phone Detox",
difficulty:"Easy",
rarity:"Common",
xp:25,
duration:15,
color:"#FFFFFF",
icon:"📵",
theme:"Ice"
},

{
id:3,
title:"Iron Legs",
description:"Complete 40 bodyweight squats.",
category:"Fitness",
difficulty:"Easy",
rarity:"Common",
xp:20,
duration:8,
color:"#FFFFFF",
icon:"💪",
theme:"Forest"
},

{
id:4,
title:"Mind Reset",
description:"Meditate quietly for 10 minutes.",
category:"Mindset",
difficulty:"Easy",
rarity:"Common",
xp:25,
duration:10,
color:"#FFFFFF",
icon:"🧠",
theme:"Galaxy"
},

{
id:5,
title:"Mission Clean",
description:"Clean your study desk completely.",
category:"Productivity",
difficulty:"Easy",
rarity:"Common",
xp:20,
duration:10,
color:"#FFFFFF",
icon:"🧹",
theme:"Sunset"
},

{
id:6,
title:"Word Hunter",
description:"Learn five new English words.",
category:"Knowledge",
difficulty:"Medium",
rarity:"Uncommon",
xp:40,
duration:15,
color:"#A855F7",
icon:"📖",
theme:"Galaxy"
},

{
id:7,
title:"Hydration Hero",
description:"Drink two glasses of water right now.",
category:"Discipline",
difficulty:"Easy",
rarity:"Common",
xp:20,
duration:5,
color:"#FFFFFF",
icon:"💧",
theme:"Ocean"
},

{
id:8,
title:"Kindness Quest",
description:"Help a family member without being asked.",
category:"Social",
difficulty:"Easy",
rarity:"Common",
xp:25,
duration:10,
color:"#FFFFFF",
icon:"🤝",
theme:"Forest"
},

{
id:9,
title:"Brain Sprint",
description:"Solve 10 questions without checking your phone.",
category:"Focus",
difficulty:"Medium",
rarity:"Uncommon",
xp:45,
duration:15,
color:"#A855F7",
icon:"📝",
theme:"Neon"
},

{
id:10,
title:"Digital Sunset",
description:"No social media for the next 30 minutes.",
category:"Phone Detox",
difficulty:"Medium",
rarity:"Rare",
xp:60,
duration:30,
color:"#22C55E",
icon:"🌅",
theme:"Sunset"
},

{
id:11,
title:"Core Warrior",
description:"Hold a plank for one minute twice.",
category:"Fitness",
difficulty:"Medium",
rarity:"Uncommon",
xp:45,
duration:10,
color:"#A855F7",
icon:"🔥",
theme:"Volcano"
},

{
id:12,
title:"Future Letter",
description:"Write five sentences to your future self.",
category:"Mindset",
difficulty:"Medium",
rarity:"Rare",
xp:60,
duration:15,
color:"#22C55E",
icon:"✉️",
theme:"Galaxy"
},

{
id:13,
title:"Zero Clutter",
description:"Delete 25 useless photos or screenshots.",
category:"Productivity",
difficulty:"Medium",
rarity:"Rare",
xp:55,
duration:15,
color:"#22C55E",
icon:"🗑️",
theme:"Neon"
},

{
id:14,
title:"Skill Forge",
description:"Learn one completely new skill for 20 minutes.",
category:"Knowledge",
difficulty:"Hard",
rarity:"Epic",
xp:120,
duration:20,
color:"#EF4444",
icon:"⚡",
theme:"Volcano"
},

{
id:15,
title:"Phoenix Rise",
description:"Finish the hardest task you've been avoiding this week.",
category:"Legendary",
difficulty:"Hard",
rarity:"Legendary",
xp:300,
duration:30,
color:"#FFD700",
icon:"👑",
theme:"Royal"
}
];
  
