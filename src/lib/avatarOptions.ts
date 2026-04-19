export const MALE_AVATARS: string[] = [
  'https://api.dicebear.com/9.x/micah/svg?seed=Arif',
  'https://api.dicebear.com/9.x/micah/svg?seed=Rafi',
  'https://api.dicebear.com/9.x/micah/svg?seed=Tanvir',
  'https://api.dicebear.com/9.x/micah/svg?seed=Siam',
  'https://api.dicebear.com/9.x/micah/svg?seed=Nayeem',
  'https://api.dicebear.com/9.x/micah/svg?seed=Jubair',
  'https://api.dicebear.com/9.x/micah/svg?seed=Sabbir',
  'https://api.dicebear.com/9.x/micah/svg?seed=Fahim',
  'https://api.dicebear.com/9.x/micah/svg?seed=Anik',
  'https://api.dicebear.com/9.x/micah/svg?seed=Mahim',
  'https://api.dicebear.com/9.x/micah/svg?seed=Adnan',
  'https://api.dicebear.com/9.x/micah/svg?seed=Tahmid',
  'https://api.dicebear.com/9.x/micah/svg?seed=Hasib',
  'https://api.dicebear.com/9.x/micah/svg?seed=Shahriar',
  'https://api.dicebear.com/9.x/micah/svg?seed=Rakib',
  'https://api.dicebear.com/9.x/micah/svg?seed=Imran',
];

export const FEMALE_AVATARS: string[] = [
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Ayesha',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Nusrat',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Faria',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Anika',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Mim',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Rima',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Farzana',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Sadia',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Samia',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Jannat',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Nabila',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Lamia',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Raisa',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Ishita',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Priya',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Mehnaz',
];

export const OTHER_AVATARS: string[] = [
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Nova',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Sky',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=River',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Echo',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Azra',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Rayan',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Noor',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Ash',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Zen',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Ocean',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Jude',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Rin',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Ari',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Shawn',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Ira',
  'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Koa',
];

export const getAvatarOptionsByGender = (gender?: string): string[] => {
  if (gender === 'Male') return MALE_AVATARS;
  if (gender === 'Female') return FEMALE_AVATARS;
  return OTHER_AVATARS;
};
