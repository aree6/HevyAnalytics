import { pickDeterministic } from '../../../utils/analysis/common';

export interface TrendCopy {
  title: string;
  description: string;
  subtext: string;
}

export const getNewCopy = (seedBase: string, sessionsRemaining: number, minSessions: number): TrendCopy => {
  const title = pickDeterministic(`${seedBase}|title`, [
    'Just getting started',
    'First timer',
    'Rookie numbers',
    'Building your base',
    'Day one energy',
    'Fresh slate',
    'Warm-up phase',
    'Foundation loading',
    'Calibration mode',
    'New chapter',
  ] as const);
  const description = pickDeterministic(`${seedBase}|desc`, [
    "First session in the books! We're figuring out what you've got.",
    "Welcome to the party! Let's see what these muscles can do.",
    'Two sessions down! Starting to see your patterns emerge.',
    'Look at you, all consistent! The data gods are pleased.',
    `Building your profile. ${sessionsRemaining} more sessions until we can read your mind.`,
    `Crunching the numbers. ${sessionsRemaining} sessions to unlock the good stuff.`,
    "Early signs are promising! Keep showing up and we'll make magic happen.",
    "Ooh, I like what I'm seeing! Don't get weird on me now.",
    `So close! ${sessionsRemaining} session${sessionsRemaining === 1 ? '' : 's'} to go before the real fun begins.`,
    `Almost there! ${sessionsRemaining} session${sessionsRemaining === 1 ? '' : 's'} left to impress me.`,
    `Keep logging - the algorithm gets hungry after ${minSessions}+ snacks.`,
    `Don't ghost me now! ${minSessions}+ sessions and I'll reveal your secrets.`,
    'Early data looks clean. Keep it consistent and we\'ll dial this in fast.',
    "We're still learning your starting point. Keep the setup consistent and let the trend form.",
    'Too early to judge - but the habit is forming. Stack a few more sessions.',
    "We're collecting signal. Same movement, same intent, better insights soon.",
  ] as const);
  const subtext = pickDeterministic(`${seedBase}|sub`, [
    'Perfect form first, champ. Pick something you can actually finish without crying.',
    'Form over ego, my friend. Choose a weight that won\'t make you question your life choices.',
    'Same setup, same reps, same greatness. Consistency is sexier than variety right now.',
    "Don't get creative yet. Stick to the script and we'll both be happier.",
    'Grip, stance, depth - make it your signature move. Film it for the highlights reel.',
    'Same setup every time. Your future self will thank present you for not being chaotic.',
    'Once we know your starting point, we can start the real training. Patience, young padawan.',
    'Master the basics first, then we can play with the fancy toys.',
    'No rush to be a hero. Learn the movement before you try to be Instagram famous.',
    'Walk before you run, lift before you ego-lift. The basics are boring for a reason.',
    'Keep the variables boring: same tempo, same depth, same rest. Let progress be the novelty.',
    'Treat every rep like practice. Skill first, strength next.',
    'Pick a repeatable load and own it. Consistency now buys freedom later.',
    'Stay honest with form. Clean reps today become PRs later.',
  ] as const);

  return { title, description, subtext };
};
