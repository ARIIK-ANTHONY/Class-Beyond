import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentBottomNav } from "@/components/student-bottom-nav";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function Badges() {
  const { data: badges, isLoading } = useQuery({
    queryKey: ["/api/student/badges"],
  });

  const badgeInfo: Record<string, { title: string; description: string; icon: string }> = {
    first_lesson: {
      title: "First Steps",
      description: "Complete your first lesson",
      icon: "emoji_events",
    },
    quiz_master: {
      title: "Quiz Master",
      description: "Score 100% on 5 quizzes",
      icon: "star",
    },
    perfect_score: {
      title: "Perfect Score",
      description: "Get 100% on a quiz",
      icon: "grade",
    },
    week_streak: {
      title: "Week Warrior",
      description: "Learn for 7 days in a row",
      icon: "local_fire_department",
    },
    subject_champion: {
      title: "Subject Champion",
      description: "Complete all lessons in a subject",
      icon: "workspace_premium",
    },
    curious_learner: {
      title: "Curious Learner",
      description: "Complete 20 lessons",
      icon: "psychology",
    },
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-icons text-4xl">emoji_events</span>
            <h1 className="text-2xl md:text-3xl font-bold">Your Badges</h1>
          </div>
          <p className="text-primary-foreground/90">Achievements you've earned on your learning journey</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-3xl font-bold text-primary" data-testid="earned-count">
                {badges?.earned?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Badges Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-3xl font-bold text-muted-foreground" data-testid="locked-count">
                {6 - (badges?.earned?.length || 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">To Unlock</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="py-6 text-center">
              <p className="text-3xl font-bold text-foreground">
                {Math.round(((badges?.earned?.length || 0) / 6) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Collection Complete</p>
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
                  className={`${isLocked ? "opacity-60" : "hover-elevate"}`}
                  data-testid={`badge-card-${badgeType}`}
                >
                  <CardContent className="py-8 text-center">
                    <div className="relative inline-block mb-4">
                      <span
                        className={`material-icons text-6xl ${
                          isLocked ? "text-muted-foreground" : "text-primary"
                        }`}
                      >
                        {info.icon}
                      </span>
                      {isLocked && (
                        <span className="material-icons absolute -bottom-1 -right-1 text-2xl text-muted-foreground">
                          lock
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{info.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{info.description}</p>
                    {earned && (
                      <Badge variant="secondary" className="mt-2">
                        Earned {new Date(earned.earnedAt).toLocaleDateString()}
                      </Badge>
                    )}
                    {isLocked && (
                      <Badge variant="outline" className="mt-2">
                        Locked
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <StudentBottomNav />
    </div>
  );
}
