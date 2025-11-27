import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export default function StudentHome() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery<{
    completedLessons: number;
    totalLessons: number;
    badges: number;
    averageScore: number;
  }>({
    queryKey: ["/api/student/stats"],
  });

  const { data: recentLessons, isLoading: lessonsLoading } = useQuery<Array<{
    id: string;
    title: string;
    subject: string;
    description: string;
    progress: number;
  }>>({
    queryKey: ["/api/student/recent-lessons"],
  });

  const { data: recentBadges } = useQuery<Array<{
    id: string;
    badgeType: string;
    earnedAt: string;
  }>>({
    queryKey: ["/api/student/recent-badges"],
  });

  const { data: upcomingSessions } = useQuery<Array<{
    id: string;
    mentorName: string;
    subject: string;
    scheduledAt: string;
    description?: string;
    meetingLink?: string;
  }>>({
    queryKey: ["/api/student/upcoming-sessions"],
    onSuccess: (data) => {
      console.log('📅 Upcoming sessions loaded:', data);
      if (data && data.length > 0) {
        console.log('First session meetingLink:', data[0].meetingLink);
      }
    },
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
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
                <h1 className="text-2xl font-bold text-foreground">
                  {getGreeting()}, {user?.firstName || "Student"}!
                </h1>
                <p className="text-sm text-muted-foreground">Ready to continue learning?</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              {/* Progress Overview */}
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-foreground">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription>Lessons Completed</CardDescription>
                          <span className="material-icons text-primary">menu_book</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-foreground" data-testid="stat-lessons">
                          {stats?.completedLessons || 0}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          of {stats?.totalLessons || 0} available
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription>Badges Earned</CardDescription>
                          <span className="material-icons text-primary">emoji_events</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-foreground" data-testid="stat-badges">
                          {stats?.badges || 0}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Keep learning!</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription>Average Score</CardDescription>
                          <span className="material-icons text-primary">grade</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-foreground" data-testid="stat-average">
                          {stats?.averageScore || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Quiz performance</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </section>

        {/* Continue Learning */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Continue Learning</h2>
            <Link href="/lessons">
              <Button variant="ghost" size="sm" data-testid="button-view-all-lessons">
                View All
              </Button>
            </Link>
          </div>

          {lessonsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : recentLessons && recentLessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentLessons.map((lesson: any) => (
                <Card key={lesson.id} className="hover-elevate" data-testid={`lesson-${lesson.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-icons text-primary">
                            {lesson.subject === "math"
                              ? "calculate"
                              : lesson.subject === "english"
                                ? "translate"
                                : "science"}
                          </span>
                          <Badge variant="secondary" className="capitalize">
                            {lesson.subject}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {lesson.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lesson.progress > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{lesson.progress}%</span>
                        </div>
                        <Progress value={lesson.progress} className="h-2" />
                      </div>
                    )}
                    <Link href={`/lesson/${lesson.id}`}>
                      <Button className="w-full" data-testid={`button-continue-${lesson.id}`}>
                        {lesson.progress > 0 ? "Continue" : "Start Lesson"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <span className="material-icons text-muted-foreground text-5xl mb-4">
                  menu_book
                </span>
                <p className="text-muted-foreground mb-4">No lessons yet. Start exploring!</p>
                <Link href="/lessons">
                  <Button data-testid="button-browse-lessons">Browse Lessons</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Mentorship Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">Get Help from a Mentor</h2>
          <Card className="hover-elevate">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-icons text-primary text-4xl">people</span>
                    <h3 className="text-lg font-bold text-foreground">Need help with a subject?</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Connect with experienced mentors who can guide you through challenging topics in
                    Math, English, and Science.
                  </p>
                </div>
                <Link href="/mentorship/request">
                  <Button size="lg" data-testid="button-request-mentorship">
                    <span className="material-icons mr-2">person_add</span>
                    Request Mentor
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Upcoming Sessions with Calendar */}
        <section className="mb-8">
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
                    <Card key={session.id} className="hover-elevate border-l-4 border-l-primary">
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
                                {`Session with ${session.mentorName}`}
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Opening meet link:', session.meetingLink);
                                if (session.meetingLink) {
                                  window.open(session.meetingLink, '_blank', 'noopener,noreferrer');
                                }
                              }}
                            >
                              <span className="material-icons mr-1 text-lg">video_call</span>
                              Join Meet
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => console.log('No meeting link available for session:', session.id)}
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

        {/* Recent Badges */}
        {recentBadges && recentBadges.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Recent Achievements</h2>
              <Link href="/badges">
                <Button variant="ghost" size="sm" data-testid="button-view-all-badges">
                  View All
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentBadges.slice(0, 4).map((badge: any) => (
                <Card
                  key={badge.id}
                  className="hover-elevate text-center"
                  data-testid={`badge-${badge.badgeType}`}
                >
                  <CardContent className="py-6">
                    <span className="material-icons text-primary text-4xl mb-2">emoji_events</span>
                    <p className="font-medium text-sm capitalize">
                      {badge.badgeType.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
