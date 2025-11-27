import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
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

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
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
                <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your account and view your progress</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-4xl mx-auto">
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
              <Button variant="outline" onClick={() => {}}>Edit Profile</Button>
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
