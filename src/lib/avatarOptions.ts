export const MALE_AVATARS: string[] = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Arif',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Rafi',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Tanvir',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Siam',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Nayeem',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Jubair',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Sabbir',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Fahim',
];

export const FEMALE_AVATARS: string[] = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Ayesha',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Nusrat',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Faria',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Anika',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Mim',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Rima',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Farzana',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Sadia',
];

export const OTHER_AVATARS: string[] = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Nova',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Sky',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=River',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Echo',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Azra',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Rayan',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Noor',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Ash',
];

export const getAvatarOptionsByGender = (gender?: string): string[] => {
  if (gender === 'Male') return MALE_AVATARS;
  if (gender === 'Female') return FEMALE_AVATARS;
  return OTHER_AVATARS;
};
