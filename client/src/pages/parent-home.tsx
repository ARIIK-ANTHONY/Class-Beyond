import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentHome() {
  const [selectedChild, setSelectedChild] = useState<string>("");

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ["/api/parent/children"],
  });

  const { data: childStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/parent/child-stats", selectedChild],
    enabled: !!selectedChild,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/parent/child-activity", selectedChild],
    enabled: !!selectedChild,
  });

  const { data: upcomingSessions } = useQuery({
    queryKey: ["/api/parent/child-sessions", selectedChild],
    enabled: !!selectedChild,
  });

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-4xl">family_restroom</span>
                <h1 className="text-2xl md:text-3xl font-bold">Parent Dashboard</h1>
              </div>
              <p className="text-primary-foreground/90">Monitor your child's learning progress</p>
            </div>
            <Button
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => (window.location.href = "/api/logout")}
              data-testid="button-logout"
            >
              <span className="material-icons">logout</span>
            </Button>
          </div>

          {/* Child Selector */}
          {childrenLoading ? (
            <Skeleton className="h-12 w-full max-w-xs" />
          ) : children && children.length > 0 ? (
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger
                className="w-full max-w-xs bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground"
                data-testid="select-child"
              >
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child: any) => (
                  <SelectItem key={child.id} value={child.id} data-testid={`child-${child.id}`}>
                    {child.firstName} {child.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Card className="max-w-md">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  No children registered under your account
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!selectedChild ? (
          <Card>
            <CardContent className="py-16 text-center">
              <span className="material-icons text-muted-foreground text-6xl mb-4">
                child_care
              </span>
              <p className="text-lg font-medium text-foreground mb-2">Select a Child</p>
              <p className="text-muted-foreground">
                Choose a child from the dropdown above to view their progress
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Learning Stats */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground">Learning Progress</h2>
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
                          <CardDescription>Lessons Completed</CardDescription>
                          <span className="material-icons text-primary">menu_book</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold" data-testid="stat-lessons">
                          {childStats?.completedLessons || 0}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          of {childStats?.totalLessons || 0} available
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
                        <p className="text-3xl font-bold" data-testid="stat-badges">
                          {childStats?.badges || 0}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Achievements unlocked</p>
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
                        <p className="text-3xl font-bold" data-testid="stat-average">
                          {childStats?.averageScore || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Quiz performance</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription>Learning Streak</CardDescription>
                          <span className="material-icons text-primary">local_fire_department</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold" data-testid="stat-streak">
                          {childStats?.streak || 0}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Days in a row</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </section>

            {/* Upcoming Sessions */}
            {upcomingSessions && upcomingSessions.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-foreground">Upcoming Mentorship Sessions</h2>
                <div className="space-y-3">
                  {upcomingSessions.map((session: any) => (
                    <Card key={session.id} data-testid={`session-${session.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <span className="material-icons text-primary mt-1 text-3xl">event</span>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {session.subject} Session with {session.mentorName}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(session.scheduledAt).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="secondary">Scheduled</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Activity */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-foreground">Recent Activity</h2>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity: any) => (
                    <Card key={activity.id} className="hover-elevate" data-testid={`activity-${activity.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <span className="material-icons text-muted-foreground mt-1">
                            {activity.type === "quiz" ? "quiz" : "menu_book"}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <div className="text-right">
                            {activity.score && (
                              <Badge variant={activity.score >= 80 ? "default" : "secondary"}>
                                {activity.score}%
                              </Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.timestamp).toLocaleDateString()}
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
                      history
                    </span>
                    <p className="text-muted-foreground">No recent activity</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
