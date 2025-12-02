import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/notification-bell";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export default function MentorHome() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalSessions: number;
    pendingRequests: number;
    sessionsThisWeek: number;
    studentsHelped: number;
  }>({
    queryKey: ["/api/mentor/stats"],
  });

  const { data: upcomingSessions } = useQuery<Array<{
    id: string;
    studentName: string;
    subject: string;
    scheduledAt: string;
    description?: string;
    meetingLink?: string;
  }>>({
    queryKey: ["/api/mentor/upcoming-sessions"],
  });

  const { data: pendingRequests } = useQuery<Array<{
    id: string;
    studentName: string;
    subject: string;
    createdAt: string;
    requestMessage?: string;
  }>>({
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
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              {/* Stats Overview */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Overview</h2>
                  <Link href="/mentor/profile">
                    <Button variant="outline" size="sm" className="gap-2">
                      <span className="material-icons text-sm">person</span>
                      My Profile
                    </Button>
                  </Link>
                </div>
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
                              <Link href="/mentor/sessions">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`button-view-${request.id}`}
                                >
                                  View
                                </Button>
                              </Link>
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

              {/* Upcoming Sessions with Calendar */}
              <section>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Calendar */}
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="material-icons text-primary">calendar_month</span>
                        {selectedDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </CardTitle>
                      <CardDescription>Click a date to filter sessions</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md"
                        modifiers={{
                          hasSession: upcomingSessions?.map((s: any) => new Date(s.scheduledAt)) || []
                        }}
                        modifiersClassNames={{
                          hasSession: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                        }}
                      />
                      {selectedDate && (
                        <div className="mt-3 pt-3 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedDate(new Date())}
                            className="w-full text-xs"
                          >
                            <span className="material-icons text-sm mr-1">today</span>
                            Today
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sessions List */}
                  <div className="lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">
                          {selectedDate 
                            ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                            : 'Upcoming Sessions'}
                        </h2>
                        {selectedDate && upcomingSessions && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {upcomingSessions.filter((session: any) => {
                              const sessionDate = new Date(session.scheduledAt);
                              return sessionDate.toDateString() === selectedDate.toDateString();
                            }).length} session(s) scheduled
                          </p>
                        )}
                      </div>
                      {selectedDate && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDate(undefined)}
                        >
                          <span className="material-icons text-sm mr-1">clear</span>
                          View All
                        </Button>
                      )}
                    </div>
                    {upcomingSessions && upcomingSessions.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingSessions
                          .filter((session: any) => {
                            if (!selectedDate) return true;
                            const sessionDate = new Date(session.scheduledAt);
                            return sessionDate.toDateString() === selectedDate.toDateString();
                          })
                          .map((session: any) => (
                          <Card key={session.id} className="hover-elevate border-l-4 border-l-primary" data-testid={`session-${session.id}`}>
                            <CardContent className="py-4">
                              <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[60px]">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {new Date(session.scheduledAt).toLocaleTimeString('en-US', { 
                                      hour: 'numeric',
                                      hour12: true 
                                    }).split(' ')[1]}
                                  </span>
                                  <span className="text-2xl font-bold text-primary">
                                    {new Date(session.scheduledAt).toLocaleTimeString('en-US', { 
                                      hour: 'numeric',
                                      hour12: false 
                                    }).split(':')[0]}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(session.scheduledAt).toLocaleTimeString('en-US', { 
                                      minute: '2-digit'
                                    }).split(':')[1]}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-foreground text-lg">
                                      {session.studentName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    {session.subject && (
                                      <Badge variant="secondary" className="capitalize">
                                        <span className="material-icons text-xs mr-1">subject</span>
                                        {session.subject}
                                      </Badge>
                                    )}
                                  </div>
                                  {session.description && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      {session.description.split('\n')[0]}
                                    </p>
                                  )}
                                </div>
                                {session.meetingLink ? (
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    data-testid={`button-session-${session.id}`}
                                    onClick={() => {
                                      console.log('Mentor joining from home:', session.meetingLink);
                                      window.open(session.meetingLink!, '_blank', 'noopener,noreferrer');
                                    }}
                                  >
                                    <span className="material-icons mr-1 text-lg">video_call</span>
                                    Join Meet
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    data-testid={`button-session-${session.id}`}
                                  >
                                    <span className="material-icons mr-1 text-lg">info</span>
                                    Details
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {upcomingSessions.filter((session: any) => {
                          if (!selectedDate) return true;
                          const sessionDate = new Date(session.scheduledAt);
                          return sessionDate.toDateString() === selectedDate.toDateString();
                        }).length === 0 && (
                          <Card>
                            <CardContent className="py-12 text-center">
                              <span className="material-icons text-muted-foreground text-5xl mb-4">
                                event_available
                              </span>
                              <p className="text-muted-foreground">No sessions scheduled for this date</p>
                            </CardContent>
                          </Card>
                        )}
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
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
