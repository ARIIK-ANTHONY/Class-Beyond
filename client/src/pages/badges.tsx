import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Trophy, Lock, Star, Flame, Award, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";

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

export default function Badges() {
  const { data: badges = [], isLoading } = useQuery<Badge[]>({
    queryKey: ["/api/student/badges"],
  });

  const style = {
    "--sidebar-width": "16rem",
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <SidebarProvider style={style}>
        <AppSidebar />
        <main className="w-full">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <NotificationBell />
            <OfflineIndicator />
          </header>
          <div className="container mx-auto p-6">
            <div className="text-center">Loading badges...</div>
          </div>
        </main>
      </SidebarProvider>
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
    <SidebarProvider style={style}>
      <AppSidebar />
      <main className="w-full">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex-1" />
          <NotificationBell />
          <OfflineIndicator />
        </header>

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
      </main>
    </SidebarProvider>
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
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="student" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <OfflineIndicator />
          
          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Your Badges</h1>
                <p className="text-sm text-muted-foreground">Achievements you've earned on your learning journey</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <CardContent className="py-6 text-center">
              <span className="material-icons text-5xl text-green-600 dark:text-green-400 mb-2">workspace_premium</span>
              <p className="text-4xl font-bold text-green-900 dark:text-green-100" data-testid="earned-count">
                {badges?.earned?.length || 0}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1 font-medium">Badges Earned</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950">
            <CardContent className="py-6 text-center">
              <span className="material-icons text-5xl text-gray-600 dark:text-gray-400 mb-2">lock</span>
              <p className="text-4xl font-bold text-gray-900 dark:text-gray-100" data-testid="locked-count">
                {6 - (badges?.earned?.length || 0)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">To Unlock</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
            <CardContent className="py-6">
              <div className="text-center mb-3">
                <span className="material-icons text-5xl text-blue-600 dark:text-blue-400 mb-2">trending_up</span>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(((badges?.earned?.length || 0) / 6) * 100)}%
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-medium">Progress</p>
              </div>
              <Progress 
                value={((badges?.earned?.length || 0) / 6) * 100} 
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Badges Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(badgeInfo).map(([badgeType, info]) => {
              const earned = badges?.earned?.find((b: any) => b.badgeType === badgeType);
              const isLocked = !earned;

              return (
                <Card
                  key={badgeType}
                  className={`${isLocked ? "opacity-70" : "hover-elevate border-2"} transition-all duration-300 ${!isLocked && "border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950"}`}
                  data-testid={`badge-card-${badgeType}`}
                >
                  <CardHeader>
                    <div className="relative inline-block mx-auto mb-2">
                      {!isLocked && (
                        <div className="absolute inset-0 animate-ping opacity-20">
                          <span className="material-icons text-7xl">
                            {info.icon}
                          </span>
                        </div>
                      )}
                      <span
                        className={`material-icons text-7xl relative ${
                          isLocked ? "text-muted-foreground" : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {info.icon}
                      </span>
                      {isLocked && (
                        <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1">
                          <span className="material-icons text-3xl text-muted-foreground">
                            lock
                          </span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-center text-xl">{info.title}</CardTitle>
                    <CardDescription className="text-center">{info.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    {earned ? (
                      <>
                        <Badge className="bg-green-600 hover:bg-green-700 text-white px-4 py-1">
                          <span className="material-icons text-sm mr-1">check</span>
                          Unlocked
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Earned {new Date(earned.earnedAt).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="px-4 py-1">
                          <span className="material-icons text-sm mr-1">lock</span>
                          Locked
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Complete the challenge to unlock
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
