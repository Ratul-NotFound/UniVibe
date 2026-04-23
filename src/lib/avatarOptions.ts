const MALE_SEEDS = [
  'Arif', 'Rafi', 'Tanvir', 'Siam', 'Nayeem', 'Jubair', 'Sabbir', 'Fahim', 'Anik', 'Mahim',
  'Adnan', 'Tahmid', 'Hasib', 'Shahriar', 'Rakib', 'Imran', 'Farhan', 'Rizwan', 'Saif', 'Nahid',
  'Tasin', 'Nabil', 'Shuvo', 'Rayhan', 'Afnan', 'Maruf', 'Shafin', 'Hridoy', 'Asif', 'Rasel',
  'Sajid', 'Noman', 'Tamim', 'Omi', 'Tawhid', 'Nafis', 'Wafi', 'Sohan', 'Rumman', 'Ayan',
  'Mahfuz', 'Ridwan', 'Shakib', 'Rifat', 'Adib', 'Minhaj', 'Tan', 'Zayan',
];

const FEMALE_SEEDS = [
  'Ayesha', 'Nusrat', 'Faria', 'Anika', 'Mim', 'Rima', 'Farzana', 'Sadia', 'Samia', 'Jannat',
  'Nabila', 'Lamia', 'Raisa', 'Ishita', 'Priya', 'Mehnaz', 'Orpa', 'Tanjila', 'Noshin', 'Ruponti',
  'Sanzida', 'Afia', 'Sumaiya', 'Tuba', 'Tahsin', 'Labiba', 'Raiha', 'Arisha', 'Sinthia', 'Nidra',
  'Alifa', 'Tania', 'Mahira', 'Safa', 'Fabiha', 'Nisat', 'Iffat', 'Nazia', 'Rukaiya', 'Muntaha',
  'Jui', 'Maliha', 'Nusaiba', 'Sabrina', 'Rhea', 'Arohi', 'Tuli', 'Rafina',
];

const OTHER_SEEDS = [
  'Nova', 'Sky', 'River', 'Echo', 'Azra', 'Rayan', 'Noor', 'Ash', 'Zen', 'Ocean',
  'Jude', 'Rin', 'Ari', 'Shawn', 'Ira', 'Koa', 'Milan', 'Avery', 'Robin', 'Reese',
  'Taylor', 'Sage', 'Rowan', 'Alex', 'Drew', 'Kai', 'Shai', 'Sam', 'Nuri', 'Eden',
  'Shiloh', 'Charlie', 'Mika', 'Indigo', 'Parker', 'Blair', 'Rumi', 'Cyan', 'Marlow', 'Phoenix',
  'Ellis', 'Harper', 'Jordan', 'Casey', 'Remy', 'Rivera', 'Aster', 'Lennon',
];

const buildStyleSet = (style: 'micah' | 'lorelei' | 'adventurer-neutral' | 'avataaars-neutral', seeds: string[]): string[] =>
  seeds.map((seed) => `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`);

// Use stable style-only URLs to avoid broken links from unsupported params.
export const MALE_AVATARS: string[] = buildStyleSet('micah', MALE_SEEDS);
export const FEMALE_AVATARS: string[] = buildStyleSet('micah', FEMALE_SEEDS);
export const OTHER_AVATARS: string[] = buildStyleSet('avataaars-neutral', OTHER_SEEDS);

export const getAvatarOptionsByGender = (gender?: string): string[] => {
  if (gender === 'Male') return MALE_AVATARS;
  if (gender === 'Female') return FEMALE_AVATARS;
  return OTHER_AVATARS;
};
