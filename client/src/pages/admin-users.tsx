import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const { data: students, isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users/students"],
  });

  const { data: teachers, isLoading: teachersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users/teachers"],
  });

  const { data: mentors, isLoading: mentorsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users/mentors"],
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const renderUserList = (users: any[], role: string, loading: boolean) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      );
    }

    if (!users || users.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="material-icons text-muted-foreground text-5xl mb-4">
              person_off
            </span>
            <p className="text-muted-foreground">No {role}s found</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id} className="hover-elevate">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {user.firstName} {user.lastName || ""}
                    </p>
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="admin" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <OfflineIndicator />
          
          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                <p className="text-sm text-muted-foreground">View and manage all platform users</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Students */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">
                    Students ({students?.length || 0})
                  </h2>
                </div>
                {renderUserList(students || [], "student", studentsLoading)}
              </section>

              {/* Teachers */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">
                    Teachers ({teachers?.length || 0})
                  </h2>
                </div>
                {renderUserList(teachers || [], "teacher", teachersLoading)}
              </section>

              {/* Mentors */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">
                    Mentors ({mentors?.length || 0})
                  </h2>
                </div>
                {renderUserList(mentors || [], "mentor", mentorsLoading)}
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
