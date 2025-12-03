import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Trophy, Lock, Star, Flame, Award, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Badge {
  id: string;
  name: string;
  description: string;
  type: "achievement" | "streak" | "participation" | "mastery" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  icon: string;
  requirement: any;
  points: number;
  progress: number;
  earnedAt?: Date | null;
  isEarned: boolean;
}

// Rarity colors
const rarityColors = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-yellow-500",
};

const rarityBorders = {
  common: "border-gray-400",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-yellow-400",
};

// Type icons
const typeIcons = {
  achievement: Target,
  streak: Flame,
  participation: Award,
  mastery: Star,
  special: Trophy,
};

export default function StudentBadges() {
  const { data: badges = [], isLoading } = useQuery<Badge[]>({
    queryKey: ["/api/student/badges"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading badges...</div>
      </div>
    );
  }

  // Group badges by type
  const groupedBadges = {
    achievement: badges.filter((b) => b.type === "achievement"),
    streak: badges.filter((b) => b.type === "streak"),
    participation: badges.filter((b) => b.type === "participation"),
    mastery: badges.filter((b) => b.type === "mastery"),
    special: badges.filter((b) => b.type === "special"),
  };

  // Calculate stats
  const totalBadges = badges.length;
  const earnedBadges = badges.filter((b) => b.isEarned).length;
  const totalPoints = badges.filter((b) => b.isEarned).reduce((sum, b) => sum + b.points, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Your Badges
        </h1>
        <p className="text-muted-foreground">
          Earn badges by completing quizzes, maintaining streaks, and being an active learner!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnedBadges} / {totalBadges}
            </div>
            <Progress value={(earnedBadges / totalBadges) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{totalPoints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge Collection */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="achievement">Achievement</TabsTrigger>
          <TabsTrigger value="streak">Streak</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="mastery">Mastery</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <BadgeGrid badges={badges} />
        </TabsContent>

        {Object.entries(groupedBadges).map(([type, typeBadges]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <BadgeGrid badges={typeBadges} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const TypeIcon = typeIcons[badge.type];
  const isLocked = !badge.isEarned;
  const progressPercentage = badge.requirement.value
    ? (badge.progress / badge.requirement.value) * 100
    : 0;

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:scale-105 ${
        isLocked ? "opacity-60 grayscale" : ""
      } border-2 ${rarityBorders[badge.rarity]}`}
    >
      {/* Rarity indicator */}
      <div className={`absolute top-0 right-0 w-16 h-16 ${rarityColors[badge.rarity]} opacity-20`} />

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Badge Icon */}
            <div
              className={`text-5xl ${
                isLocked ? "filter grayscale" : ""
              }`}
            >
              {isLocked ? <Lock className="w-12 h-12" /> : badge.icon}
            </div>

            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {badge.name}
                {!isLocked && <TypeIcon className="w-4 h-4" />}
              </CardTitle>
              <BadgeUI
                variant="outline"
                className={`mt-1 text-xs ${rarityColors[badge.rarity]} text-white`}
              >
                {badge.rarity}
              </BadgeUI>
            </div>
          </div>

          {/* Points */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Points</div>
            <div className="text-lg font-bold text-yellow-500">{badge.points}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <CardDescription>{badge.description}</CardDescription>

        {/* Progress */}
        {!isLocked && badge.earnedAt && (
          <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
            ✓ Earned on {new Date(badge.earnedAt).toLocaleDateString()}
          </div>
        )}

        {isLocked && badge.requirement.value && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {badge.progress} / {badge.requirement.value}
              </span>
            </div>
            <Progress value={Math.min(progressPercentage, 100)} />
          </div>
        )}

        {/* Requirement description */}
        <div className="text-xs text-muted-foreground">
          {getRequirementDescription(badge.requirement)}
        </div>
      </CardContent>
    </Card>
  );
}

function getRequirementDescription(requirement: any): string {
  switch (requirement.type) {
    case "quiz_count":
      return `Complete ${requirement.value} ${requirement.value === 1 ? "quiz" : "quizzes"}`;
    case "perfect_score":
      return `Get 100% on ${requirement.value} ${requirement.value === 1 ? "quiz" : "quizzes"}`;
    case "lesson_count":
      return `Complete ${requirement.value} ${requirement.value === 1 ? "lesson" : "lessons"}`;
    case "login_streak":
      return `Log in ${requirement.value} days in a row`;
    case "forum_posts":
      return `Make ${requirement.value} forum ${requirement.value === 1 ? "post" : "posts"}`;
    case "forum_replies":
      return `Reply to ${requirement.value} forum ${requirement.value === 1 ? "post" : "posts"}`;
    case "mentor_sessions":
      return `Attend ${requirement.value} mentorship ${requirement.value === 1 ? "session" : "sessions"}`;
    case "subject_mastery":
      return `Complete ${requirement.value} ${requirement.subject} quizzes with ${requirement.minScore}%+ average`;
    case "time_based":
      return `Complete ${requirement.value} ${requirement.value === 1 ? "quiz" : "quizzes"} between ${requirement.startHour}:00 and ${requirement.endHour}:00`;
    case "weekend_activity":
      return `Complete ${requirement.value} ${requirement.value === 1 ? "activity" : "activities"} on weekends`;
    case "speed_completion":
      return `Complete a quiz in under ${requirement.value / 60} minutes with ${requirement.minScore}%`;
    default:
      return "Complete the requirement to earn this badge";
  }
}
