import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherHome() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/teacher/recent-activity"],
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="teacher" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <OfflineIndicator />
          
          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your lessons and students</p>
              </div>
            </div>
            <Link href="/teacher/lessons/new">
              <Button data-testid="button-create-lesson">
                <span className="material-icons mr-2 text-lg">add</span>
                Create Lesson
              </Button>
            </Link>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              {/* Stats Overview */}
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-foreground">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                    </>
                  ) : (
                    <>
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>My Lessons</CardDescription>
                            <span className="material-icons text-primary">menu_book</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-lessons">
                            {stats?.totalLessons || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stats?.approvedLessons || 0} approved
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Active Students</CardDescription>
                            <span className="material-icons text-primary">people</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-students">
                            {stats?.activeStudents || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">This week</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Quiz Submissions</CardDescription>
                            <span className="material-icons text-primary">quiz</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-quizzes">
                            {stats?.quizSubmissions || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">This month</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Avg. Performance</CardDescription>
                            <span className="material-icons text-primary">trending_up</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-performance">
                            {stats?.avgPerformance || 0}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Student scores</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </section>

              {/* Recent Activity */}
              <section>
                <h2 className="text-xl font-bold mb-4 text-foreground">Recent Activity</h2>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity: any) => (
                      <Card key={activity.id} className="hover-elevate">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <span className="material-icons text-muted-foreground mt-1">
                              {activity.type === "quiz" ? "quiz" : "menu_book"}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{activity.studentName}</p>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={activity.score >= 80 ? "default" : "secondary"}>
                                {activity.score}%
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <span className="material-icons text-muted-foreground text-5xl mb-4">
                        notifications_none
                      </span>
                      <p className="text-muted-foreground">No recent activity</p>
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
