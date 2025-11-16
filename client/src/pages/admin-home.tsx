import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminHome() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ["/api/admin/pending-approvals"],
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="admin" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <OfflineIndicator />
          
          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Platform management and analytics</p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              {/* System Stats */}
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-foreground">System Overview</h2>
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
                            <CardDescription>Total Users</CardDescription>
                            <span className="material-icons text-primary">people</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-users">
                            {stats?.totalUsers || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stats?.activeThisWeek || 0} active this week
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Total Lessons</CardDescription>
                            <span className="material-icons text-primary">menu_book</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-lessons">
                            {stats?.totalLessons || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stats?.pendingApproval || 0} pending approval
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Quiz Completions</CardDescription>
                            <span className="material-icons text-primary">quiz</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-quizzes">
                            {stats?.totalQuizzes || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">This month</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Platform Health</CardDescription>
                            <span className="material-icons text-primary">health_and_safety</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-green-600">Healthy</p>
                          <p className="text-sm text-muted-foreground mt-1">All systems operational</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </section>

              {/* Pending Approvals */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Pending Content Approval</h2>
                  <Link href="/admin/approval">
                    <Button variant="ghost" size="sm" data-testid="button-view-all-approvals">
                      View All
                    </Button>
                  </Link>
                </div>

                {pendingApprovals && pendingApprovals.length > 0 ? (
                  <div className="space-y-3">
                    {pendingApprovals.slice(0, 5).map((lesson: any) => (
                      <Card key={lesson.id} className="hover-elevate">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="capitalize">
                                  {lesson.subject}
                                </Badge>
                                <Badge variant="outline">{lesson.level}</Badge>
                              </div>
                              <p className="font-medium text-foreground">{lesson.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                By {lesson.teacherName} • {new Date(lesson.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" data-testid={`button-approve-${lesson.id}`}>
                                <span className="material-icons mr-1 text-lg">check</span>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-review-${lesson.id}`}
                              >
                                Review
                              </Button>
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
                        check_circle
                      </span>
                      <p className="text-muted-foreground">No pending approvals</p>
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
