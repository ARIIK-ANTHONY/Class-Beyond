import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentBottomNav } from "@/components/student-bottom-nav";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function LessonViewer() {
  const [, params] = useRoute("/lesson/:id");
  const lessonId = params?.id;
  const { toast } = useToast();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
  });

  const markProgressMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/student/progress/${lessonId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/recent-lessons"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  const completeLesson = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/student/complete-lesson/${lessonId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Lesson Complete!",
        description: "Great job! You've completed this lesson.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/recent-lessons"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  useEffect(() => {
    if (lesson && !lesson.isViewed) {
      markProgressMutation.mutate();
    }
  }, [lesson]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Skeleton className="h-32 w-full" />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <StudentBottomNav />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <span className="material-icons text-muted-foreground text-6xl mb-4">error_outline</span>
            <p className="text-lg font-medium mb-2">Lesson not found</p>
            <Link href="/lessons">
              <Button>Browse Lessons</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/lessons">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                data-testid="button-back"
              >
                <span className="material-icons">arrow_back</span>
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize bg-primary-foreground/20 text-primary-foreground border-0">
                  {lesson.subject}
                </Badge>
                <Badge variant="outline" className="capitalize border-primary-foreground/30 text-primary-foreground">
                  {lesson.level}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{lesson.title}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              title="Download for offline"
              data-testid="button-download-lesson"
            >
              <span className="material-icons">download</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Lesson Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="py-8 prose prose-lg max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
          </CardContent>
        </Card>

        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            className="flex-1"
            onClick={() => completeLesson.mutate()}
            disabled={completeLesson.isPending || lesson.isCompleted}
            data-testid="button-complete-lesson"
          >
            {lesson.isCompleted ? (
              <>
                <span className="material-icons mr-2">check_circle</span>
                Lesson Completed
              </>
            ) : (
              <>
                <span className="material-icons mr-2">task_alt</span>
                Mark as Complete
              </>
            )}
          </Button>

          {lesson.hasQuiz && (
            <Link href={`/quiz/${lesson.quizId}`} className="flex-1">
              <Button variant="outline" className="w-full" data-testid="button-take-quiz">
                <span className="material-icons mr-2">quiz</span>
                Take Quiz
              </Button>
            </Link>
          )}
        </div>
      </div>

      <StudentBottomNav />
    </div>
  );
}
