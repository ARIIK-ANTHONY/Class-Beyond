import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
