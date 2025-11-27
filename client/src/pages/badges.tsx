import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
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

  const style = {
    "--sidebar-width": "16rem",
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
