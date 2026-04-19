const MALE_SEEDS = [
  'Arif', 'Rafi', 'Tanvir', 'Siam', 'Nayeem', 'Jubair', 'Sabbir', 'Fahim', 'Anik', 'Mahim',
  'Adnan', 'Tahmid', 'Hasib', 'Shahriar', 'Rakib', 'Imran', 'Farhan', 'Rizwan', 'Saif', 'Nahid',
  'Tasin', 'Nabil', 'Shuvo', 'Rayhan', 'Afnan', 'Maruf', 'Shafin', 'Hridoy', 'Asif', 'Rasel',
  'Sajid', 'Noman', 'Tamim', 'Omi', 'Tawhid', 'Nafis', 'Wafi', 'Sohan', 'Rumman', 'Ayan',
];

const FEMALE_SEEDS = [
  'Ayesha', 'Nusrat', 'Faria', 'Anika', 'Mim', 'Rima', 'Farzana', 'Sadia', 'Samia', 'Jannat',
  'Nabila', 'Lamia', 'Raisa', 'Ishita', 'Priya', 'Mehnaz', 'Orpa', 'Tanjila', 'Noshin', 'Ruponti',
  'Sanzida', 'Afia', 'Sumaiya', 'Tuba', 'Tahsin', 'Labiba', 'Raiha', 'Arisha', 'Sinthia', 'Nidra',
  'Alifa', 'Tania', 'Mahira', 'Safa', 'Fabiha', 'Nisat', 'Iffat', 'Nazia', 'Rukaiya', 'Muntaha',
];

const OTHER_SEEDS = [
  'Nova', 'Sky', 'River', 'Echo', 'Azra', 'Rayan', 'Noor', 'Ash', 'Zen', 'Ocean',
  'Jude', 'Rin', 'Ari', 'Shawn', 'Ira', 'Koa', 'Milan', 'Avery', 'Robin', 'Reese',
  'Taylor', 'Sage', 'Rowan', 'Alex', 'Drew', 'Kai', 'Shai', 'Sam', 'Nuri', 'Eden',
  'Shiloh', 'Charlie', 'Mika', 'Indigo', 'Parker', 'Blair', 'Rumi', 'Cyan', 'Marlow', 'Phoenix',
];

const buildInitialAvatars = (seeds: string[], backgroundType: string): string[] =>
  seeds.map(
    (seed) =>
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&fontWeight=700&fontSize=42&chars=1&backgroundType=${backgroundType}`
  );

export const MALE_AVATARS: string[] = buildInitialAvatars(MALE_SEEDS, 'gradientLinear');

export const FEMALE_AVATARS: string[] = buildInitialAvatars(FEMALE_SEEDS, 'gradientRadial');

export const OTHER_AVATARS: string[] = [
  ...buildInitialAvatars(OTHER_SEEDS, 'solid'),
];

export const getAvatarOptionsByGender = (gender?: string): string[] => {
  if (gender === 'Male') return MALE_AVATARS;
  if (gender === 'Female') return FEMALE_AVATARS;
  return OTHER_AVATARS;
};
