import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentBottomNav } from "@/components/student-bottom-nav";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getLesson, saveLesson, hasLesson } from "@/lib/offlineDB";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import type { Lesson } from "@shared/schema";

export default function LessonViewer() {
  const [, params] = useRoute("/lesson/:id");
  const lessonId = params?.id;
  const { toast } = useToast();
  const [isOfflineLesson, setIsOfflineLesson] = useState(false);
  const [offlineCached, setOfflineCached] = useState(false);

  const { data: lesson, isLoading, error } = useQuery<any>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
  });

  // Save lesson to IndexedDB after fetching
  useEffect(() => {
    if (lesson) {
      saveLesson(lesson).catch(err => console.debug("Failed to cache lesson:", err));
      setIsOfflineLesson(false);
    }
  }, [lesson]);

  // Check if lesson is cached offline
  useEffect(() => {
    if (lessonId) {
      hasLesson(lessonId).then(setOfflineCached);
    }
  }, [lessonId]);

  // Try loading from IndexedDB if fetch fails
  useEffect(() => {
    if (error && lessonId && !lesson) {
      getLesson(lessonId).then(cached => {
        if (cached) {
          setIsOfflineLesson(true);
          // Manually set in query cache so UI can render
          queryClient.setQueryData(["/api/lessons", lessonId], cached);
          toast({
            title: "Offline Mode",
            description: "Showing cached version of this lesson.",
          });
        }
      });
    }
  }, [error, lessonId, lesson]);

  const handleDownload = async () => {
    if (!lesson) return;
    try {
      await saveLesson(lesson);
      setOfflineCached(true);
      toast({
        title: "Downloaded!",
        description: "This lesson is now available offline.",
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Could not save lesson for offline use.",
        variant: "destructive",
      });
    }
  };

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
    if (lesson && lesson.id && !markProgressMutation.isSuccess) {
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
              title={offlineCached ? "Available offline" : "Download for offline"}
              onClick={handleDownload}
              disabled={offlineCached}
              data-testid="button-download-lesson"
            >
              <span className="material-icons">
                {offlineCached ? "cloud_done" : "download"}
              </span>
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

        {/* External Content Section */}
        {lesson.externalContent && Array.isArray(lesson.externalContent) && lesson.externalContent.length > 0 && (
          <div className="mb-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="material-icons text-primary">collections</span>
              Additional Resources
            </h2>
            
            {lesson.externalContent.map((content: any, index: number) => (
              <Card key={index} className="overflow-hidden">
                {content.type === 'video' && (
                  <>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-red-500">play_circle</span>
                        <CardTitle className="text-xl">{content.title}</CardTitle>
                      </div>
                      {content.description && (
                        <CardDescription>{content.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <AspectRatio ratio={16 / 9}>
                        <iframe
                          src={content.url.replace('watch?v=', 'embed/')}
                          title={content.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full rounded-md"
                        />
                      </AspectRatio>
                    </CardContent>
                  </>
                )}
                
                {content.type === 'book' && (
                  <>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-blue-500">menu_book</span>
                        <CardTitle className="text-xl">{content.title}</CardTitle>
                      </div>
                      {content.author && (
                        <CardDescription>by {content.author}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {content.description && (
                        <p className="text-muted-foreground mb-4">{content.description}</p>
                      )}
                      <a 
                        href={content.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full">
                          <span className="material-icons mr-2">open_in_new</span>
                          Read on Open Library
                        </Button>
                      </a>
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Quiz Preview Section */}
        {lesson.quiz && lesson.quiz.questions && Array.isArray(lesson.quiz.questions) && lesson.quiz.questions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-icons text-primary text-3xl">quiz</span>
                    <CardTitle className="text-2xl">Quiz Available</CardTitle>
                  </div>
                  <CardDescription>
                    Test your knowledge with {lesson.quiz.questions.length} question{lesson.quiz.questions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {lesson.quiz.questions.length} Questions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sm">timer</span>
                    <span>Complete at your own pace</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-sm">emoji_events</span>
                    <span>Earn points and badges</span>
                  </div>
                </div>
                <Separator />
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="material-icons text-sm">preview</span>
                    Quiz Preview
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {lesson.quiz.questions.slice(0, 3).map((q: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-medium text-primary">{idx + 1}.</span>
                        <span className="text-muted-foreground line-clamp-1">{q.question}</span>
                      </li>
                    ))}
                    {lesson.quiz.questions.length > 3 && (
                      <li className="text-muted-foreground italic">
                        +{lesson.quiz.questions.length - 3} more question{lesson.quiz.questions.length - 3 !== 1 ? 's' : ''}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            className="flex-1"
            onClick={() => completeLesson.mutate()}
            disabled={completeLesson.isPending || (lesson.isCompleted === true)}
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

          {lesson.quiz && lesson.quiz.id && (
            <Link href={`/quiz/${lesson.quiz.id}`} className="flex-1">
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
