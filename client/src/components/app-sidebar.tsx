import { Home, BookOpen, Users, User, Settings, BarChart3, CheckCircle, HelpCircle, LogOut, Trophy, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface AppSidebarProps {
  role: "teacher" | "admin" | "mentor" | "student";
}

export function AppSidebar({ role }: AppSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const teacherMenuItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "My Lessons", url: "/teacher/lessons", icon: BookOpen },
    { title: "Students", url: "/teacher/students", icon: Users },
    { title: "Progress", url: "/teacher/progress", icon: BarChart3 },
  ];

  const adminMenuItems = [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Content Approval", url: "/admin/approval", icon: CheckCircle },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const mentorMenuItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "My Profile", url: "/mentor/profile", icon: User },
    { title: "Sessions", url: "/mentor/sessions", icon: Users },
    { title: "Q&A Forum", url: "/mentor/forum", icon: HelpCircle },
  ];

  const studentMenuItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Lessons", url: "/lessons", icon: BookOpen },
    { title: "Mentors", url: "/mentors", icon: Users },
    { title: "Q&A Forum", url: "/student/forum", icon: MessageSquare },
    { title: "Badges", url: "/badges", icon: Trophy },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const menuItems =
    role === "admin" 
      ? adminMenuItems 
      : role === "mentor" 
        ? mentorMenuItems 
        : role === "student"
          ? studentMenuItems
          : teacherMenuItems;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-icons text-primary text-3xl">school</span>
            <div>
              <h2 className="text-xl font-bold text-sidebar-foreground">ClassBeyond</h2>
              <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
