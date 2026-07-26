import { CHALLENGES } from './challenges.data';
import type { OutstandChallenge } from './challenges.types';

// 1. Re-export all your modularized files
export * from './challenges.data';
export * from './challenges.styles';
export * from './challenges.types';

// 2. The randomChallenge function
export const randomChallenge = (currentTitle?: string): OutstandChallenge => {
  const available = CHALLENGES.filter(c => c.title !== currentTitle);
  return available[Math.floor(Math.random() * available.length)] || CHALLENGES[0];
};

// 3. The Daily Index calculator
const getDailyIndex = () => {
  const today = new Date();
  return (today.getFullYear() + today.getMonth() + today.getDate()) % CHALLENGES.length;
};

// 👇 FIX: Exported as an arrow function instead of a static object!
export const dailyChallenge = (): OutstandChallenge => CHALLENGES[getDailyIndex()];
