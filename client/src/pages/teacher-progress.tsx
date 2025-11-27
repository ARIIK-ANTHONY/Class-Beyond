import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function TeacherProgress() {
  const { data: progressData, isLoading } = useQuery<any>({
    queryKey: ["/api/teacher/progress"],
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
                <h1 className="text-2xl font-bold text-foreground">Student Progress</h1>
                <p className="text-sm text-muted-foreground">Track performance and engagement</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isLoading ? (
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
                        <CardDescription>Avg. Completion Rate</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-green-600">
                          {progressData?.avgCompletionRate || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Student progress</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Avg. Quiz Score</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-blue-600">
                          {progressData?.avgQuizScore || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Across all quizzes</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Active Students</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {progressData?.activeStudents || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">This week</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Completions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {progressData?.totalLessonsCompleted || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Lessons completed</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Student Engagement Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Engagement</CardTitle>
                  <CardDescription>Active students vs completed lessons over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px]" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progressData?.weeklyEngagement || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="active" stroke="#8884d8" name="Active Students" />
                        <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed Lessons" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Lesson Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Performance</CardTitle>
                  <CardDescription>Average scores and completion rates by lesson</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px]" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={progressData?.lessonPerformance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="lesson" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgScore" fill="#8884d8" name="Avg Score (%)" />
                        <Bar dataKey="completions" fill="#82ca9d" name="Completions" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Quiz Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Performance Trends</CardTitle>
                  <CardDescription>Average quiz scores over recent assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px]" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progressData?.quizPerformance || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="avgScore" stroke="#8884d8" name="Average Score (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top Performers & Need Help */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers 🏆</CardTitle>
                    <CardDescription>Students excelling this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                      </div>
                    ) : progressData?.topPerformers && progressData.topPerformers.length > 0 ? (
                      <div className="space-y-3">
                        {progressData.topPerformers.slice(0, 5).map((student: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge className="w-8 h-8 rounded-full flex items-center justify-center">
                                {index + 1}
                              </Badge>
                              <div>
                                <p className="font-medium">{student.studentName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {student.lessonsCompleted} lessons completed
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">{student.avgScore}% avg</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <span className="material-icons text-4xl mb-2">people</span>
                        <p className="text-sm">No student data yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Need Attention ⚠️</CardTitle>
                    <CardDescription>Students who might need extra support</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                      </div>
                    ) : progressData?.topPerformers && progressData.topPerformers.length > 0 ? (
                      <div className="space-y-3">
                        {progressData.topPerformers
                          .filter((s: any) => s.avgScore < 75)
                          .slice(0, 5)
                          .map((student: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="material-icons text-yellow-600">warning</span>
                                <div>
                                  <p className="font-medium">{student.studentName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {student.lessonsCompleted} lessons completed
                                  </p>
                                </div>
                              </div>
                              <Badge variant="destructive">{student.avgScore}% avg</Badge>
                            </div>
                          ))}
                        {progressData.topPerformers.filter((s: any) => s.avgScore < 75).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <span className="material-icons text-4xl mb-2 text-green-600">check_circle</span>
                            <p className="text-sm">All students performing well!</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <span className="material-icons text-4xl mb-2">people</span>
                        <p className="text-sm">No student data yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
