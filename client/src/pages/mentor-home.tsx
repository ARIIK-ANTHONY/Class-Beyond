import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function MentorHome() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/mentor/stats"],
  });

  const { data: upcomingSessions } = useQuery({
    queryKey: ["/api/mentor/upcoming-sessions"],
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ["/api/mentor/pending-requests"],
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="mentor" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <OfflineIndicator />
          
          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Mentor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Guide students on their learning journey</p>
              </div>
            </div>
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
                            <CardDescription>Total Sessions</CardDescription>
                            <span className="material-icons text-primary">event</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-total-sessions">
                            {stats?.totalSessions || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">All time</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Pending Requests</CardDescription>
                            <span className="material-icons text-primary">pending_actions</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-pending-requests">
                            {stats?.pendingRequests || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Awaiting response</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>This Week</CardDescription>
                            <span className="material-icons text-primary">calendar_today</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-this-week">
                            {stats?.sessionsThisWeek || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Sessions scheduled</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Students Helped</CardDescription>
                            <span className="material-icons text-primary">people</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-students-helped">
                            {stats?.studentsHelped || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Unique students</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </section>

              {/* Pending Requests */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Pending Session Requests</h2>
                  <Link href="/mentor/sessions">
                    <Button variant="ghost" size="sm" data-testid="button-view-all-requests">
                      View All
                    </Button>
                  </Link>
                </div>

                {pendingRequests && pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 5).map((request: any) => (
                      <Card key={request.id} className="hover-elevate" data-testid={`request-${request.id}`}>
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="capitalize">
                                  {request.subject}
                                </Badge>
                                <Badge variant="outline">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </Badge>
                              </div>
                              <p className="font-medium text-foreground">{request.studentName}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {request.requestMessage || "Student needs help with this subject"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" data-testid={`button-approve-${request.id}`}>
                                <span className="material-icons mr-1 text-lg">check</span>
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-view-${request.id}`}
                              >
                                View
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
                        inbox
                      </span>
                      <p className="text-muted-foreground">No pending session requests</p>
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* Upcoming Sessions */}
              <section>
                <h2 className="text-xl font-bold mb-4 text-foreground">Upcoming Sessions</h2>
                {upcomingSessions && upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map((session: any) => (
                      <Card key={session.id} className="hover-elevate" data-testid={`session-${session.id}`}>
                        <CardContent className="py-4">
                          <div className="flex items-start gap-4">
                            <span className="material-icons text-primary mt-1 text-3xl">event</span>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{session.studentName}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="secondary" className="capitalize">
                                  {session.subject}
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(session.scheduledAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" data-testid={`button-session-${session.id}`}>
                              <span className="material-icons mr-1 text-lg">video_call</span>
                              Join
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <span className="material-icons text-muted-foreground text-5xl mb-4">
                        event_available
                      </span>
                      <p className="text-muted-foreground">No upcoming sessions scheduled</p>
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
