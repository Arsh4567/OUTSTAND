export interface MotivationMatrix {
  id: string;
  quote: string;
  author: string;
  application: string;
}

export const QUOTES: MotivationMatrix[] = [
  // --- FOCUS & DEEP WORK ---
  {
    id: "q-001",
    quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    application: "Ignoring a distracting Slack message to finish a 90-minute deep work sprint."
  },
  {
    id: "q-002",
    quote: "Deep work is to focus without distraction on a cognitively demanding task.",
    author: "Cal Newport",
    application: "Turning your phone on airplane mode and leaving it in another room while you code."
  },
  {
    id: "q-003",
    quote: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
    application: "Catching yourself doomscrolling for 45 minutes and immediately shutting off the screen."
  },
  {
    id: "q-004",
    quote: "First say to yourself what you would be; and then do what you have to do.",
    author: "Epictetus",
    application: "Defining yourself as an athlete, then putting on your running shoes even when it's raining."
  },
  {
    id: "q-005",
    quote: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
    application: "Building a strict habit of laying out your gym clothes the night before to eliminate morning friction."
  },
  {
    id: "q-006",
    quote: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.",
    author: "Bruce Lee",
    application: "Mastering a single programming language deeply instead of shallowly dabbling in five."
  },
  {
    id: "q-007",
    quote: "Impatience with actions, patience with results.",
    author: "Naval Ravikant",
    application: "Shipping the feature update today, but waiting months to see the user growth compound."
  },
  {
    id: "q-008",
    quote: "Focus is about saying no.",
    author: "Steve Jobs",
    application: "Declining a low-value meeting request to protect your morning focus block."
  },
  {
    id: "q-009",
    quote: "I can't relate to lazy people. We don't speak the same language.",
    author: "Kobe Bryant",
    application: "Pushing through the final 10 minutes of a grueling workout when your mind is telling you to quit."
  },
  {
    id: "q-010",
    quote: "Don't stop when you're tired. Stop when you're done.",
    author: "David Goggins",
    application: "Finishing the last paragraph of your report rather than leaving it for 'tomorrow morning'."
  },

  // --- MOMENTUM & FRICTION ---
  {
    id: "q-011",
    quote: "An object at rest stays at rest and an object in motion stays in motion.",
    author: "Isaac Newton",
    application: "Committing to do just one push-up, which effortlessly turns into a full workout."
  },
  {
    id: "q-012",
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    application: "Writing 500 words every single morning without fail, regardless of inspiration."
  },
  {
    id: "q-013",
    quote: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    author: "Viktor Frankl",
    application: "Taking a deliberate three-second pause before reacting to an angry client email."
  },
  {
    id: "q-014",
    quote: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu",
    application: "Opening a blank document instead of paralyzing yourself by worrying about the final 50-page thesis."
  },
  {
    id: "q-015",
    quote: "You don't lack motivation, you lack clarity.",
    author: "Alex Hormozi",
    application: "Breaking a massive, overwhelming project down into three highly specific, actionable steps for today."
  },
  {
    id: "q-016",
    quote: "All we have to decide is what to do with the time that is given us.",
    author: "J.R.R. Tolkien",
    application: "Choosing to read an educational book on your commute instead of scrolling social media."
  },
  {
    id: "q-017",
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    application: "Launching a product that flops, diagnosing the failure, and immediately starting version 2."
  },
  {
    id: "q-018",
    quote: "Step by step walk the thousand-mile road.",
    author: "Miyamoto Musashi",
    application: "Focusing solely on hitting today's caloric deficit, not the 20 pounds you want to lose overall."
  },
  {
    id: "q-019",
    quote: "I have not failed. I've just found 10,000 ways that won't work.",
    author: "Thomas Edison",
    application: "Debugging a stubborn block of code for hours until the logic finally clicks and it compiles."
  },
  {
    id: "q-020",
    quote: "He who has a why to live for can bear almost any how.",
    author: "Friedrich Nietzsche",
    application: "Enduring a grueling late-night study session because you are determined to provide a better life for your family."
  },

  // --- DISCIPLINE OVER MOTIVATION ---
  {
    id: "q-021",
    quote: "Discipline equals freedom.",
    author: "Jocko Willink",
    application: "Waking up at 5:00 AM to handle your hardest tasks so you have total freedom in the evening."
  },
  {
    id: "q-022",
    quote: "Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.",
    author: "Sun Tzu",
    application: "Meticulously planning your entire week's schedule on Sunday night before Monday begins."
  },
  {
    id: "q-023",
    quote: "The obstacle in the path becomes the path.",
    author: "Ryan Holiday",
    application: "Seeing a delayed flight not as a frustration, but as a three-hour block of uninterrupted reading time."
  },
  {
    id: "q-024",
    quote: "No man is free who is not master of himself.",
    author: "Epictetus",
    application: "Resisting the primal urge to eat junk food when you are stressed or tired."
  },
  {
    id: "q-025",
    quote: "Discipline yourself, and others won't need to.",
    author: "John Wooden",
    application: "Submitting your project deliverables a day early without your manager having to ask for an update."
  },
  {
    id: "q-026",
    quote: "We must all suffer one of two things: the pain of discipline or the pain of regret.",
    author: "Jim Rohn",
    application: "Choosing the temporary physical discomfort of the gym over the long-term mental discomfort of lethargy."
  },
  {
    id: "q-027",
    quote: "Strength does not come from winning. Your struggles develop your strengths.",
    author: "Arnold Schwarzenegger",
    application: "Volunteering for a project that is slightly above your current skill level to force adaptation."
  },
  {
    id: "q-028",
    quote: "Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.",
    author: "Theodore Roosevelt",
    application: "Choosing to build a high-risk startup from scratch instead of taking the easy, comfortable corporate job."
  },
  {
    id: "q-029",
    quote: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
    author: "Muhammad Ali",
    application: "Pushing through the repetitive, boring foundational parts of learning a complex new skill."
  },
  {
    id: "q-030",
    quote: "The man who moves a mountain begins by carrying away small stones.",
    author: "Confucius",
    application: "Paying off just $50 of a massive debt today, knowing the momentum will compound."
  },

  // --- RESILIENCE & MENTAL TOUGHNESS ---
  {
    id: "q-031",
    quote: "Our greatest glory is not in never failing, but in rising up every time we fail.",
    author: "Ralph Waldo Emerson",
    application: "Bombing a high-stakes interview and immediately applying to three more jobs that same afternoon."
  },
  {
    id: "q-032",
    quote: "I never lose. I either win or learn.",
    author: "Nelson Mandela",
    application: "Analyzing a lost sales pitch objectively to upgrade your strategy for the next one."
  },
  {
    id: "q-033",
    quote: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    application: "Pivoting your business model overnight when the market suddenly shifts against your original plan."
  },
  {
    id: "q-034",
    quote: "Whether you think you can, or you think you can't – you're right.",
    author: "Henry Ford",
    application: "Genuinely believing you can run a marathon, which alters your identity and forces you to start training."
  },
  {
    id: "q-035",
    quote: "It's not whether you get knocked down, it's whether you get up.",
    author: "Vince Lombardi",
    application: "Getting rejected by an investor and sending the pitch deck to ten more without hesitation."
  },
  {
    id: "q-036",
    quote: "Smooth seas do not make skillful sailors.",
    author: "African Proverb",
    application: "Actively volunteering to lead the hardest, messiest project at work to forge your leadership skills."
  },
  {
    id: "q-037",
    quote: "Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened.",
    author: "Helen Keller",
    application: "Forgiving yourself for a severe mistake and actively, painfully working to rectify it."
  },
  {
    id: "q-038",
    quote: "You miss 100% of the shots you don't take.",
    author: "Wayne Gretzky",
    application: "Asking for the promotion or the raise even if you feel you might not be 100% ready yet."
  },
  {
    id: "q-039",
    quote: "Some people want it to happen, some wish it would happen, others make it happen.",
    author: "Michael Jordan",
    application: "Cold-emailing 50 prospects directly instead of passively waiting for inbound leads."
  },
  {
    id: "q-040",
    quote: "I will prepare and some day my chance will come.",
    author: "Abraham Lincoln",
    application: "Studying aggressively for industry certifications while waiting for the right job opening to appear."
  },

  // --- EXECUTION & RELENTLESS ACTION ---
  {
    id: "q-041",
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    application: "Publishing the rough draft of your article today instead of endlessly tweaking it in secret."
  },
  {
    id: "q-042",
    quote: "Well done is better than well said.",
    author: "Benjamin Franklin",
    application: "Actually going to the gym and lifting weights instead of just talking to your friends about your fitness goals."
  },
  {
    id: "q-043",
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    application: "Writing the first line of code for your app idea today instead of watching another tutorial."
  },
  {
    id: "q-044",
    quote: "I have been impressed with the urgency of doing. Knowing is not enough; we must apply.",
    author: "Leonardo da Vinci",
    application: "Implementing one specific strategy from a self-help book immediately after reading the chapter."
  },
  {
    id: "q-045",
    quote: "The cost of being wrong is less than the cost of doing nothing.",
    author: "Seth Godin",
    application: "Launching an imperfect MVP to gather real user feedback rather than building in a vacuum."
  },
  {
    id: "q-046",
    quote: "Inaction breeds doubt and fear. Action breeds confidence and courage.",
    author: "Dale Carnegie",
    application: "Making the intimidating, high-stakes phone call right now instead of putting it off until tomorrow."
  },
  {
    id: "q-047",
    quote: "Plans are only good intentions unless they immediately degenerate into hard work.",
    author: "Peter Drucker",
    application: "Turning your abstract yearly goals into highly specific, daily, trackable metrics."
  },
  {
    id: "q-048",
    quote: "I am not a product of my circumstances. I am a product of my decisions.",
    author: "Stephen Covey",
    application: "Deciding to stay entirely calm and listen to an audiobook during a massive traffic jam instead of getting angry."
  },
  {
    id: "q-049",
    quote: "A real decision is measured by the fact that you've taken a new action. If there's no action, you haven't truly decided.",
    author: "Tony Robbins",
    application: "Throwing out all the junk food in your pantry the exact moment you decide to go on a diet."
  },
  {
    id: "q-050",
    quote: "As long as you live, keep learning how to live.",
    author: "Seneca",
    application: "Reviewing your daily Outstand logs every night to find microscopic areas of improvement for tomorrow."
  }
];
