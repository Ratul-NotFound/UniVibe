export type DailyMood = 'all' | 'study' | 'chill' | 'explore' | 'deep';

export interface DailyPuzzle {
  id: string;
  question: string;
  answer: string;
  hint: string;
  rewardScore: number;
  rewardCoins: number;
}

export interface DailyMission {
  id: string;
  title: string;
  done: boolean;
  rewardScore: number;
  rewardCoins: number;
}

export interface DailyBattle {
  id: string;
  title: string;
  left: string;
  right: string;
  vote: 'left' | 'right' | null;
  rewarded: boolean;
  rewardScore: number;
  rewardCoins: number;
}

export interface DailyContent {
  dayKey: string;
  puzzle: DailyPuzzle;
  missions: DailyMission[];
  battle: DailyBattle;
  puzzleSolved: boolean;
  hintUnlocked: boolean;
  createdAt: number;
}

const PUZZLES: Omit<DailyPuzzle, 'rewardScore' | 'rewardCoins'>[] = [
  {
    id: 'p1',
    question: 'I have keys but no locks. I have space but no room. What am I?',
    answer: 'keyboard',
    hint: 'You are using it right now.',
  },
  {
    id: 'p2',
    question: 'What comes once in a minute, twice in a moment, and never in a thousand years?',
    answer: 'm',
    hint: 'Think of letters, not time.',
  },
  {
    id: 'p3',
    question: 'I can be cracked, made, told, and played. What am I?',
    answer: 'joke',
    hint: 'It usually makes people laugh.',
  },
  {
    id: 'p4',
    question: 'What 5-letter word becomes shorter when you add two letters?',
    answer: 'short',
    hint: 'The answer is a common adjective.',
  },
  {
    id: 'p5',
    question: 'What has many teeth but cannot bite?',
    answer: 'comb',
    hint: 'You use it with hair.',
  },
];

const MISSION_TEMPLATES = [
  'Send one connection request in {mood} mood.',
  'Find someone outside your department and interact.',
  'Like a profile with 50%+ compatibility.',
  'Explore one new department category in Search.',
  'Open Matches and respond to one pending request.',
  'Complete today\'s puzzle challenge.',
];

const BATTLES = [
  { id: 'b1', title: 'Campus Battle', left: 'Tea Person', right: 'Coffee Person' },
  { id: 'b2', title: 'Study Vibe', left: 'Night Owl', right: 'Early Bird' },
  { id: 'b3', title: 'Hangout Pick', left: 'Mountain', right: 'Sea' },
  { id: 'b4', title: 'Weekend Plan', left: 'Gaming', right: 'Movies' },
];

const normalize = (v: string) => v.trim().toLowerCase();

const hash = (input: string) => {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
};

const pickBySeed = <T,>(arr: T[], seed: number, count = 1): T[] => {
  if (arr.length === 0) return [];
  const picked: T[] = [];
  const used = new Set<number>();

  let offset = 0;
  while (picked.length < Math.min(count, arr.length)) {
    const idx = (seed + offset) % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      picked.push(arr[idx]);
    }
    offset += 7;
  }

  return picked;
};

export const getDayKey = () => new Date().toISOString().slice(0, 10);

export const isPuzzleAnswerCorrect = (candidate: string, answer: string) => normalize(candidate) === normalize(answer);

export const generateDailyContent = ({
  uid,
  dayKey,
}: {
  uid: string;
  dayKey: string;
}): DailyContent => {
  const seed = hash(`${uid}:${dayKey}`);

  const [puzzleBase] = pickBySeed(PUZZLES, seed, 1);
  const missions = pickBySeed(MISSION_TEMPLATES, seed + 13, 3).map((title, i) => ({
    id: `m${i + 1}`,
    title: String(title).replace('{mood}', ['study', 'chill', 'explore', 'deep'][((seed + i) % 4)]),
    done: false,
    rewardScore: 20,
    rewardCoins: 2,
  }));

  const [battleBase] = pickBySeed(BATTLES, seed + 29, 1);

  return {
    dayKey,
    puzzle: {
      ...puzzleBase,
      rewardScore: 35,
      rewardCoins: 4,
    },
    missions,
    battle: {
      ...battleBase,
      vote: null,
      rewarded: false,
      rewardScore: 10,
      rewardCoins: 1,
    },
    puzzleSolved: false,
    hintUnlocked: false,
    createdAt: Date.now(),
  };
};
