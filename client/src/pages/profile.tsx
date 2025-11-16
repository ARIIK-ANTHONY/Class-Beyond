import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StudentBottomNav } from "@/components/student-bottom-nav";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function Profile() {
  const { user } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["/api/student/stats"],
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-icons text-4xl">account_circle</span>
            <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
          </div>
          <p className="text-primary-foreground/90">Manage your account and view your progress</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-foreground mb-1" data-testid="user-name">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-muted-foreground mb-2" data-testid="user-email">
                  {user?.email}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user?.role} • Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Learning Statistics</CardTitle>
            <CardDescription>Your overall performance and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{stats?.completedLessons || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Lessons</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{stats?.badges || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Badges</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{stats?.averageScore || 0}%</p>
                <p className="text-sm text-muted-foreground mt-1">Avg Score</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{stats?.streak || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <div className="space-y-3">
          <Card className="hover-elevate">
            <CardContent className="py-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                data-testid="button-logout"
                onClick={() => (window.location.href = "/api/logout")}
              >
                <span className="material-icons mr-3">logout</span>
                <div>
                  <p className="font-medium">Log Out</p>
                  <p className="text-sm text-muted-foreground">Sign out of your account</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <StudentBottomNav />
    </div>
  );
}
