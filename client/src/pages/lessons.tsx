import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { saveLessons, getAllLessons, saveLesson, hasLesson } from "@/lib/offlineDB";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lesson } from "@shared/schema";

export default function Lessons() {
    const { user, isAuthenticated } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [offlineStatus, setOfflineStatus] = useState<Record<string, boolean>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: lessons, isLoading, error } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons", selectedSubject],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject && selectedSubject !== "all") {
        params.append("subject", selectedSubject);
      }
      const url = `/api/lessons${params.toString() ? `?${params.toString()}` : ''}`;
      
      // Get auth token from Firebase
      const currentUser = (await import("@/lib/firebase")).auth.currentUser;
      const headers: Record<string, string> = {};
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
        headers,
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch lessons");
      }
      return response.json();
    },
  });

  // Fetch detailed lesson data when preview is opened
  const { data: lessonDetails } = useQuery<any>({
    queryKey: ["/api/lessons", selectedLesson?.id],
    enabled: !!selectedLesson?.id && previewOpen,
  });

  // Enroll in lesson mutation
  const enrollMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await apiRequest("POST", `/api/student/enroll/${lessonId}`, {});
    },
    onSuccess: (_, lessonId) => {
      toast({
        title: "Enrolled!",
        description: "You've successfully enrolled in this lesson.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/recent-lessons"] });
      setPreviewOpen(false);
      setLocation(`/lesson/${lessonId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to enroll in lesson.",
        variant: "destructive",
      });
    },
  });

  // Save lessons to IndexedDB when fetched online
  useEffect(() => {
    if (lessons && lessons.length > 0) {
      saveLessons(lessons).catch(err => {
        console.debug("Failed to cache lessons offline:", err);
      });
    }
  }, [lessons]);

  // Check which lessons are available offline
  useEffect(() => {
    const checkOfflineStatus = async () => {
      if (!lessons) return;
      const status: Record<string, boolean> = {};
      for (const lesson of lessons) {
        status[lesson.id] = await hasLesson(lesson.id);
      }
      setOfflineStatus(status);
    };
    checkOfflineStatus();
  }, [lessons]);

  // Handle manual download
  const handleDownload = async (lesson: Lesson) => {
    try {
      await saveLesson(lesson);
      setOfflineStatus(prev => ({ ...prev, [lesson.id]: true }));
      toast({
        title: "Downloaded!",
        description: `${lesson.title} is now available offline.`,
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Could not save lesson for offline use.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (lesson: any) => {
    setSelectedLesson(lesson);
    setPreviewOpen(true);
  };

  const handleEnroll = () => {
    if (!isAuthenticated || user?.role !== "student") {
      // Redirect to signup/login if not authenticated as student
      window.location.href = "/signup";
      return;
    }
    if (selectedLesson) {
      enrollMutation.mutate(selectedLesson.id);
    }
  };

  // Fallback to IndexedDB if offline
  const displayLessons = lessons || [];

  const subjects = [
    { id: "all", name: "All Subjects", icon: "apps" },
    { id: "math", name: "Mathematics", icon: "calculate" },
    { id: "english", name: "English", icon: "translate" },
    { id: "science", name: "Science", icon: "science" },
  ];

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
                <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
                <p className="text-sm text-muted-foreground">Explore curriculum-aligned content</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
        {/* Subject Tabs */}
        <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            {subjects.map((subject) => (
              <TabsTrigger
                key={subject.id}
                value={subject.id}
                className="flex items-center gap-2"
                data-testid={`tab-${subject.id}`}
              >
                <span className="material-icons text-lg">{subject.icon}</span>
                <span className="hidden md:inline">{subject.name}</span>
                <span className="md:hidden">{subject.name.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Lessons Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : lessons && lessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson: any) => (
              <Card key={lesson.id} className="hover-elevate flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-primary text-3xl">
                        {lesson.subject === "math"
                          ? "calculate"
                          : lesson.subject === "english"
                            ? "translate"
                            : "science"}
                      </span>
                      <div>
                        <Badge variant="secondary" className="capitalize">
                          {lesson.subject}
                        </Badge>
                        <Badge variant="outline" className="ml-2 capitalize">
                          {lesson.level}
                        </Badge>
                      </div>
                    </div>
                    {offlineStatus[lesson.id] && (
                      <span
                        className="material-icons text-green-600"
                        title="Available offline"
                        data-testid={`offline-${lesson.id}`}
                      >
                        cloud_done
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handlePreview(lesson)}
                      data-testid={`button-view-${lesson.id}`}
                    >
                      <span className="material-icons mr-2">visibility</span>
                      Preview & Enroll
                    </Button>
                    {!offlineStatus[lesson.id] && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Download for offline"
                        onClick={() => handleDownload(lesson)}
                        data-testid={`button-download-${lesson.id}`}
                      >
                        <span className="material-icons">download</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <span className="material-icons text-muted-foreground text-6xl mb-4">
                {error ? "error_outline" : "search_off"}
              </span>
              <p className="text-lg font-medium text-foreground mb-2">
                {error ? "Error loading lessons" : "No lessons found"}
              </p>
              <p className="text-muted-foreground">
                {error 
                  ? "There was a problem loading the lessons. Please try refreshing the page." 
                  : "Try selecting a different subject or check back later for new content"
                }
              </p>
              {error && (
                <Button onClick={() => window.location.reload()} className="mt-4">
                  <span className="material-icons mr-2">refresh</span>
                  Refresh Page
                </Button>
              )}
            </CardContent>
          </Card>
        )}
            </div>
          </main>
        </div>
      </div>

      {/* Lesson Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {selectedLesson?.subject}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {selectedLesson?.level}
              </Badge>
              {lessonDetails?.quiz && (
                <Badge variant="default">
                  <span className="material-icons text-xs mr-1">quiz</span>
                  Has Quiz
                </Badge>
              )}
            </div>
            <DialogTitle className="text-2xl">{selectedLesson?.title}</DialogTitle>
            <DialogDescription>{selectedLesson?.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Lesson Content */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="material-icons text-primary">description</span>
                  Lesson Content
                </h3>
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: lessonDetails?.content || selectedLesson?.content || "Loading..." }}
                />
              </div>

              <Separator />

              {/* External Content - Videos */}
              {lessonDetails?.externalContent && Array.isArray(lessonDetails.externalContent) && lessonDetails.externalContent.filter((c: any) => c.type === 'video').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="material-icons text-red-500">play_circle</span>
                    Video Resources ({lessonDetails.externalContent.filter((c: any) => c.type === 'video').length})
                  </h3>
                  <div className="space-y-4">
                    {lessonDetails.externalContent
                      .filter((content: any) => content.type === 'video')
                      .map((content: any, index: number) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-base">{content.title}</CardTitle>
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
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* External Content - Books */}
              {lessonDetails?.externalContent && Array.isArray(lessonDetails.externalContent) && lessonDetails.externalContent.filter((c: any) => c.type === 'book').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="material-icons text-blue-500">menu_book</span>
                    Book Resources ({lessonDetails.externalContent.filter((c: any) => c.type === 'book').length})
                  </h3>
                  <div className="space-y-3">
                    {lessonDetails.externalContent
                      .filter((content: any) => content.type === 'book')
                      .map((content: any, index: number) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <CardTitle className="text-base">{content.title}</CardTitle>
                                {content.author && (
                                  <CardDescription>by {content.author}</CardDescription>
                                )}
                              </div>
                              <a 
                                href={content.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Button size="sm">
                                  <span className="material-icons text-sm mr-1">open_in_new</span>
                                  Read
                                </Button>
                              </a>
                            </div>
                          </CardHeader>
                          {content.description && (
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{content.description}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* Quiz Information */}
              {lessonDetails?.quiz && lessonDetails.quiz.questions && Array.isArray(lessonDetails.quiz.questions) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="material-icons text-primary">quiz</span>
                    Assessment Available
                  </h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-icons text-primary">help</span>
                          <span className="font-semibold">{lessonDetails.quiz.questions.length} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-icons text-primary">timer</span>
                          <span className="text-sm text-muted-foreground">Self-paced</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Complete the quiz after studying the lesson to test your understanding and earn badges!
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setPreviewOpen(false)}
            >
              Close Preview
            </Button>
            <Button 
              className="flex-1"
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
            >
              <span className="material-icons mr-2">school</span>
              {enrollMutation.isPending ? "Enrolling..." : "Enroll & Start Learning"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
