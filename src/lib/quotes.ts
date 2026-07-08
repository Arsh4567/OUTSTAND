export type Quote = { text: string; author: string };

export const QUOTES: Quote[] = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "It's not the load that breaks you down, it's the way you carry it.", author: "Lou Holtz" },
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
  { text: "Quiet the noise. Do the work. Trust the process.", author: "Unknown" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "Study while others are sleeping; work while others are loafing.", author: "William A. Ward" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
];

export function quoteOfTheDay(): Quote {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
  return QUOTES[seed % QUOTES.length];
}
