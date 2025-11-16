import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function NGOHome() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/ngo/stats"],
  });

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-4xl">analytics</span>
                <h1 className="text-2xl md:text-3xl font-bold">NGO Partner Dashboard</h1>
              </div>
              <p className="text-primary-foreground/90">Monitor platform impact and usage metrics</p>
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Platform Impact Stats */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-foreground">Platform Impact</h2>
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
                      <CardDescription>Total Students</CardDescription>
                      <span className="material-icons text-primary">school</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="stat-total-students">
                      {stats?.totalStudents || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Registered learners</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription>Active This Month</CardDescription>
                      <span className="material-icons text-primary">trending_up</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="stat-active-students">
                      {stats?.activeStudents || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Engaged learners</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription>Lessons Completed</CardDescription>
                      <span className="material-icons text-primary">task_alt</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="stat-lessons-completed">
                      {stats?.lessonsCompleted || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Total completions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription>Avg. Performance</CardDescription>
                      <span className="material-icons text-primary">grade</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="stat-avg-performance">
                      {stats?.avgPerformance || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Quiz scores</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </section>

        {/* Quick Reports */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">Reports & Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="material-icons text-primary text-3xl">assessment</span>
                  <div>
                    <CardTitle className="text-lg">Usage Report</CardTitle>
                    <CardDescription>Monthly platform engagement metrics</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-view-usage-report">
                  <span className="material-icons mr-2">visibility</span>
                  View Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="material-icons text-primary text-3xl">timeline</span>
                  <div>
                    <CardTitle className="text-lg">Impact Analysis</CardTitle>
                    <CardDescription>Student outcomes and progress trends</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-view-impact-report">
                  <span className="material-icons mr-2">visibility</span>
                  View Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
