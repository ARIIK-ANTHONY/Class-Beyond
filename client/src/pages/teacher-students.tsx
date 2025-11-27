import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function TeacherStudents() {
  const { data: students, isLoading } = useQuery<any[]>({
    queryKey: ["/api/teacher/students"],
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-red-600";
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
                <h1 className="text-2xl font-bold text-foreground">My Students</h1>
                <p className="text-sm text-muted-foreground">View and track student progress</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{students?.length || 0}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Active This Week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {students?.filter(s => s.lastActive && 
                        new Date(s.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Avg. Progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {students?.length 
                        ? Math.round(students.reduce((acc, s) => acc + (s.progress || 0), 0) / students.length)
                        : 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Students List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Students</CardTitle>
                  <CardDescription>Students enrolled in your lessons</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : !students || students.length === 0 ? (
                    <div className="py-12 text-center">
                      <span className="material-icons text-muted-foreground text-5xl mb-4">
                        school
                      </span>
                      <p className="text-muted-foreground">No students enrolled yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Students will appear here once they start taking your lessons
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {students.map((student) => (
                        <Card key={student.id} className="hover-elevate">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={student.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {getInitials(student.firstName, student.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {student.firstName} {student.lastName || ""}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{student.email}</p>
                                  </div>
                                  <Badge variant="secondary">
                                    {student.lessonsCompleted || 0} lessons completed
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Overall Progress</span>
                                    <span className={`font-medium ${getProgressColor(student.progress || 0)}`}>
                                      {student.progress || 0}%
                                    </span>
                                  </div>
                                  <Progress value={student.progress || 0} className="h-2" />
                                </div>
                                
                                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                  <span>📊 {student.quizzesCompleted || 0} quizzes</span>
                                  <span>🎯 {student.badges || 0} badges</span>
                                  <span>⏱️ Last active: {
                                    student.lastActive 
                                      ? new Date(student.lastActive).toLocaleDateString()
                                      : "Never"
                                  }</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
