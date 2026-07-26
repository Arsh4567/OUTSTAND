import { CHALLENGES } from './challenges.data';
import type { OutstandChallenge } from './challenges.types';

// 1. Re-export all your modularized files
export * from './challenges.data';
export * from './challenges.styles';
export * from './challenges.types';

// 2. Restore the missing randomChallenge function
export const randomChallenge = (currentTitle?: string): OutstandChallenge => {
  // Filter out the current challenge so we don't get duplicates back-to-back
  const available = CHALLENGES.filter(c => c.title !== currentTitle);
  return available[Math.floor(Math.random() * available.length)] || CHALLENGES[0];
};

// 3. Restore the missing dailyChallenge export
// Uses today's date to generate a consistent index so the challenge stays the same all day
const getDailyIndex = () => {
  const today = new Date();
  return (today.getFullYear() + today.getMonth() + today.getDate()) % CHALLENGES.length;
};

export const dailyChallenge: OutstandChallenge = CHALLENGES[getDailyIndex()];
