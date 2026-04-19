export const INTEREST_CATEGORIES = {
  personality: {
    weight: 4,
    interests: [
      'Introvert', 'Extrovert', 'Funny', 'Serious', 'Ambitious', 'Romantic', 
      'Adventurous', 'Calm', 'Empathetic', 'Creative', 'Optimistic', 'Realistic'
    ]
  },
  hobbies: {
    weight: 3,
    interests: [
      'Photography', 'Music', 'Drawing/Art', 'Crafting', 'Writing', 'Designing', 
      'Cooking', 'Dancing', 'Acting/Theatre', 'Gardening', 'Singing', 'Collecting'
    ]
  },
  lifestyle: {
    weight: 3,
    interests: [
      'Travel lover', 'Gym/Fitness', 'Reading', 'Gaming', 'Meditation', 'Volunteering', 
      'Entrepreneurship', 'Coding/Tech', 'Sports', 'Anime/Manga', 'Vlogging', 'Hiking'
    ]
  },
  preferences: {
    weight: 2,
    interests: [
      'Coffee person', 'Tea person', 'Mountain lover', 'Sea lover', 'Night owl', 
      'Early bird', 'Cat person', 'Dog person', 'Indoor person', 'Outdoor person', 
      'Spicy food', 'Sweet tooth'
    ]
  },
  entertainment: {
    weight: 2,
    interests: [
      'Movies', 'K-Drama', 'Cricket', 'Football', 'Podcasts', 'Stand-up Comedy', 
      'YouTube', 'Board games', 'Concerts', 'Reading books', 'Social media', 'Cooking shows'
    ]
  },
  food: {
    weight: 1,
    interests: [
      'Biryani lover', 'Pizza fan', 'Street food', 'Healthy eater', 'Vegan', 
      'Foodie explorer', 'Bubble tea', 'Lassi', 'Chai addict', 'Bakery fan', 'Seafood', 'BBQ'
    ]
  }
};

export const DEPARTMENTS = [
  'CSE', 'EEE', 'ETE', 'BBA', 'English', 'Law', 'Pharmacy', 'Architecture', 
  'Textile Engineering', 'Civil Engineering', 'Mechatronics', 'Journalism', 
  'Innovation & Entrepreneurship'
];

export const ACADEMIC_YEARS = ['1st', '2nd', '3rd', '4th', 'Alumni'];

export const LOOKING_FOR = [
  { value: 'friendship', label: 'Friendship' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'study', label: 'Study Partner' },
  { value: 'networking', label: 'Networking' }
];

export interface UserInterests {
  [key: string]: string[];
}

export interface MatchResult {
  score: number;
  commonInterests: string[];
  breakdown: Record<string, number>;
}

export function calculateMatchScore(userA: any, userB: any): MatchResult {
  let totalScore = 0;
  let maxPossibleScore = 0;
  const commonInterests: string[] = [];
  const breakdown: Record<string, number> = {};

  for (const [category, data] of Object.entries(INTEREST_CATEGORIES)) {
    const weight = data.weight;
    const interestsA = new Set(userA.interests?.[category] || []);
    const interestsB = new Set(userB.interests?.[category] || []);
    
    const common = [...interestsA].filter(x => interestsB.has(x));
    const possibleCount = Math.max(interestsA.size, interestsB.size, 1);
    
    const catScore = (common.length / possibleCount) * weight * 100;
    totalScore += catScore;
    maxPossibleScore += weight * 100;
    
    commonInterests.push(...common);
    breakdown[category] = Math.round((common.length / possibleCount) * 100);
  }

  const deptBonus = userA.department === userB.department ? 5 : 0;
  const finalScore = Math.min(100, Math.round((totalScore / maxPossibleScore) * 100) + deptBonus);

  return {
    score: finalScore,
    commonInterests,
    breakdown
  };
}
