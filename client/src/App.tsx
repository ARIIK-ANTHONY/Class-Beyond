import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";

import Landing from "@/pages/landing";
import About from "@/pages/about";
import StudentHome from "@/pages/student-home";
import TeacherHome from "@/pages/teacher-home";
import TeacherLessonCreate from "@/pages/teacher-lesson-create";
import TeacherLessonEdit from "@/pages/teacher-lesson-edit";
import TeacherLessons from "@/pages/teacher-lessons";
import TeacherStudents from "@/pages/teacher-students";
import TeacherProgress from "@/pages/teacher-progress";
import AdminHome from "@/pages/admin-home";
import AdminContentApproval from "@/pages/admin-content-approval";
import AdminUsers from "@/pages/admin-users";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminSettings from "@/pages/admin-settings";
import MentorHome from "@/pages/mentor-home";
import MentorProfileSetup from "@/pages/mentor-profile-setup";
import MentorSessions from "@/pages/mentor-sessions";
import MentorForum from "@/pages/mentor-forum";
import StudentForum from "@/pages/student-forum";
import StudentMentors from "@/pages/student-mentors";
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

  // Debug logging
  console.log("Router - isAuthenticated:", isAuthenticated);
  console.log("Router - user:", user);
  console.log("Router - user role:", user?.role);

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/about" component={About} />
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
              <Route path="/student/forum" component={StudentForum} />
              <Route path="/mentors" component={StudentMentors} />
              <Route path="/mentorship/request" component={MentorshipRequest} />
              <Route path="/:rest*" component={NotFound} />
            </>
          )}

          {/* Teacher Routes */}
          {user?.role === "teacher" && (
            <>
              <Route path="/" component={TeacherHome} />
              <Route path="/teacher/lessons" component={TeacherLessons} />
              <Route path="/teacher/lessons/new" component={TeacherLessonCreate} />
              <Route path="/teacher/lessons/:id/edit" component={TeacherLessonEdit} />
              <Route path="/teacher/students" component={TeacherStudents} />
              <Route path="/teacher/progress" component={TeacherProgress} />
              <Route path="/teacher/:rest*" component={TeacherHome} />
              <Route path="/:rest*" component={NotFound} />
            </>
          )}

          {/* Admin Routes */}
          {user?.role === "admin" && (
            <>
              <Route path="/" component={AdminHome} />
              <Route path="/admin" component={AdminHome} />
              <Route path="/admin/approval" component={AdminContentApproval} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/analytics" component={AdminAnalytics} />
              <Route path="/admin/settings" component={AdminSettings} />
              <Route path="/admin/:rest*" component={AdminHome} />
              <Route path="/:rest*" component={NotFound} />
            </>
          )}

          {/* Mentor Routes */}
          {user?.role === "mentor" && (
            <>
              <Route path="/" component={MentorHome} />
              <Route path="/mentor/profile" component={MentorProfileSetup} />
              <Route path="/mentor/sessions" component={MentorSessions} />
              <Route path="/mentor/forum" component={MentorForum} />
              <Route path="/mentor/:rest*" component={MentorHome} />
              <Route path="/:rest*" component={NotFound} />
            </>
          )}

          {/* Fallback - if user has no matching role */}
          {!["student", "teacher", "admin", "mentor"].includes(user?.role || "") && (
            <Route path="/:rest*" component={() => (
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                  <span className="material-icons text-destructive text-6xl mb-4">error</span>
                  <h1 className="text-2xl font-bold mb-2">Invalid User Role</h1>
                  <p className="text-muted-foreground mb-4">
                    Your account has role: "{user?.role}"
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please contact support or create a new account with a valid role (student, teacher, mentor, or admin).
                  </p>
                </div>
              </div>
            )} />
          )}
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
