import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

import Landing from "@/pages/landing";
import StudentHome from "@/pages/student-home";
import TeacherHome from "@/pages/teacher-home";
import AdminHome from "@/pages/admin-home";
import MentorHome from "@/pages/mentor-home";
import ParentHome from "@/pages/parent-home";
import NGOHome from "@/pages/ngo-home";
import Lessons from "@/pages/lessons";
import LessonViewer from "@/pages/lesson-viewer";
import Quiz from "@/pages/quiz";
import Badges from "@/pages/badges";
import Profile from "@/pages/profile";
import MentorshipRequest from "@/pages/mentorship-request";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons text-primary text-6xl mb-4 animate-spin">refresh</span>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/:rest*" component={Landing} />
        </>
      ) : (
        <>
          {/* Student Routes */}
          {user?.role === "student" && (
            <>
              <Route path="/" component={StudentHome} />
              <Route path="/lessons" component={Lessons} />
              <Route path="/lesson/:id" component={LessonViewer} />
              <Route path="/quiz/:id" component={Quiz} />
              <Route path="/badges" component={Badges} />
              <Route path="/profile" component={Profile} />
              <Route path="/mentorship/request" component={MentorshipRequest} />
            </>
          )}

          {/* Teacher Routes */}
          {user?.role === "teacher" && (
            <>
              <Route path="/" component={TeacherHome} />
              <Route path="/teacher/:rest*" component={TeacherHome} />
            </>
          )}

          {/* Admin Routes */}
          {user?.role === "admin" && (
            <>
              <Route path="/" component={AdminHome} />
              <Route path="/admin" component={AdminHome} />
              <Route path="/admin/:rest*" component={AdminHome} />
            </>
          )}

          {/* Mentor Routes */}
          {user?.role === "mentor" && (
            <>
              <Route path="/" component={MentorHome} />
              <Route path="/mentor/:rest*" component={MentorHome} />
            </>
          )}

          {/* Parent Routes */}
          {user?.role === "parent" && (
            <>
              <Route path="/" component={ParentHome} />
              <Route path="/parent/:rest*" component={ParentHome} />
            </>
          )}

          {/* NGO Partner Routes */}
          {user?.role === "ngo_partner" && (
            <>
              <Route path="/" component={NGOHome} />
              <Route path="/ngo/:rest*" component={NGOHome} />
            </>
          )}

          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
