import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { StudentBottomNav } from "@/components/student-bottom-nav";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentHome() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/student/stats"],
  });

  const { data: recentLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["/api/student/recent-lessons"],
  });

  const { data: recentBadges } = useQuery({
    queryKey: ["/api/student/recent-badges"],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="greeting-header">
                {getGreeting()}, {user?.firstName || "Student"}!
              </h1>
              <p className="text-primary-foreground/90 mt-1">Ready to continue learning?</p>
            </div>
            <span className="material-icons text-4xl">school</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Progress Overview */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">Your Progress</h2>
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
                    <p className="text-sm text-muted-foreground mt-1">Keep learning to earn more!</p>
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

      <StudentBottomNav />
    </div>
  );
}
