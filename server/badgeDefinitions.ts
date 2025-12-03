import type { InsertBadge } from "../shared/schema";

// Badge definitions with requirements and details
export const BADGE_DEFINITIONS: InsertBadge[] = [
  // Achievement Badges
  {
    name: "First Steps",
    description: "Complete your first quiz",
    type: "achievement",
    rarity: "common",
    icon: "🎯",
    requirement: { type: "quiz_count", value: 1 },
    points: 10,
  },
  {
    name: "Quiz Enthusiast",
    description: "Complete 5 quizzes",
    type: "achievement",
    rarity: "common",
    icon: "📚",
    requirement: { type: "quiz_count", value: 5 },
    points: 25,
  },
  {
    name: "Quiz Master",
    description: "Complete 10 quizzes",
    type: "achievement",
    rarity: "rare",
    icon: "🏆",
    requirement: { type: "quiz_count", value: 10 },
    points: 50,
  },
  {
    name: "Perfect Score",
    description: "Get 100% on any quiz",
    type: "achievement",
    rarity: "rare",
    icon: "⭐",
    requirement: { type: "perfect_score", value: 1 },
    points: 30,
  },
  {
    name: "Perfectionist",
    description: "Get 100% on 5 different quizzes",
    type: "achievement",
    rarity: "epic",
    icon: "💎",
    requirement: { type: "perfect_score", value: 5 },
    points: 100,
  },
  {
    name: "Scholar",
    description: "Complete 10 lessons",
    type: "achievement",
    rarity: "common",
    icon: "📖",
    requirement: { type: "lesson_count", value: 10 },
    points: 40,
  },
  {
    name: "Knowledge Seeker",
    description: "Complete 25 lessons",
    type: "achievement",
    rarity: "rare",
    icon: "🔍",
    requirement: { type: "lesson_count", value: 25 },
    points: 75,
  },

  // Streak Badges
  {
    name: "Getting Started",
    description: "Log in 3 days in a row",
    type: "streak",
    rarity: "common",
    icon: "🔥",
    requirement: { type: "login_streak", value: 3 },
    points: 20,
  },
  {
    name: "Week Warrior",
    description: "Log in 7 days in a row",
    type: "streak",
    rarity: "rare",
    icon: "⚡",
    requirement: { type: "login_streak", value: 7 },
    points: 50,
  },
  {
    name: "Dedicated Learner",
    description: "Log in 14 days in a row",
    type: "streak",
    rarity: "epic",
    icon: "🌟",
    requirement: { type: "login_streak", value: 14 },
    points: 100,
  },
  {
    name: "Unstoppable",
    description: "Log in 30 days in a row",
    type: "streak",
    rarity: "legendary",
    icon: "👑",
    requirement: { type: "login_streak", value: 30 },
    points: 200,
  },

  // Participation Badges
  {
    name: "First Post",
    description: "Make your first forum post",
    type: "participation",
    rarity: "common",
    icon: "💬",
    requirement: { type: "forum_posts", value: 1 },
    points: 10,
  },
  {
    name: "Active Member",
    description: "Make 10 forum posts",
    type: "participation",
    rarity: "rare",
    icon: "🗣️",
    requirement: { type: "forum_posts", value: 10 },
    points: 40,
  },
  {
    name: "Helpful Student",
    description: "Reply to 5 forum posts",
    type: "participation",
    rarity: "rare",
    icon: "🤝",
    requirement: { type: "forum_replies", value: 5 },
    points: 35,
  },
  {
    name: "Mentor Mentee",
    description: "Attend your first mentorship session",
    type: "participation",
    rarity: "common",
    icon: "👨‍🏫",
    requirement: { type: "mentor_sessions", value: 1 },
    points: 25,
  },

  // Subject Mastery Badges
  {
    name: "Math Whiz",
    description: "Complete 5 Math quizzes with 80%+ average",
    type: "mastery",
    rarity: "epic",
    icon: "🔢",
    requirement: { type: "subject_mastery", value: 5, subject: "Math", minScore: 80 },
    points: 75,
  },
  {
    name: "Science Champion",
    description: "Complete 5 Science quizzes with 80%+ average",
    type: "mastery",
    rarity: "epic",
    icon: "🔬",
    requirement: { type: "subject_mastery", value: 5, subject: "Science", minScore: 80 },
    points: 75,
  },
  {
    name: "Language Expert",
    description: "Complete 5 English quizzes with 80%+ average",
    type: "mastery",
    rarity: "epic",
    icon: "📝",
    requirement: { type: "subject_mastery", value: 5, subject: "English", minScore: 80 },
    points: 75,
  },
  {
    name: "History Buff",
    description: "Complete 5 History quizzes with 80%+ average",
    type: "mastery",
    rarity: "epic",
    icon: "🏛️",
    requirement: { type: "subject_mastery", value: 5, subject: "History", minScore: 80 },
    points: 75,
  },

  // Special Badges
  {
    name: "Night Owl",
    description: "Complete 5 quizzes between 9 PM and 6 AM",
    type: "special",
    rarity: "rare",
    icon: "🦉",
    requirement: { type: "time_based", value: 5, startHour: 21, endHour: 6 },
    points: 30,
  },
  {
    name: "Early Bird",
    description: "Complete 5 quizzes between 5 AM and 8 AM",
    type: "special",
    rarity: "rare",
    icon: "🐦",
    requirement: { type: "time_based", value: 5, startHour: 5, endHour: 8 },
    points: 30,
  },
  {
    name: "Weekend Warrior",
    description: "Complete 10 activities on weekends",
    type: "special",
    rarity: "rare",
    icon: "🎮",
    requirement: { type: "weekend_activity", value: 10 },
    points: 40,
  },
  {
    name: "Speed Demon",
    description: "Complete a quiz in under 2 minutes with 100% score",
    type: "special",
    rarity: "legendary",
    icon: "⚡",
    requirement: { type: "speed_completion", value: 120, minScore: 100 },
    points: 150,
  },
];

// Helper to get badge by name
export function getBadgeByName(name: string): InsertBadge | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.name === name);
}

// Helper to get badges by type
export function getBadgesByType(type: string): InsertBadge[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.type === type);
}

// Helper to get badges by rarity
export function getBadgesByRarity(rarity: string): InsertBadge[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.rarity === rarity);
}
