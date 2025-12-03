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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import type { Lesson } from "@shared/schema";

export default function LessonViewer() {
  const [, params] = useRoute("/lesson/:id");
  const lessonId = params?.id;
  const { toast } = useToast();
  const [isOfflineLesson, setIsOfflineLesson] = useState(false);
  const [offlineCached, setOfflineCached] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [videoProgress, setVideoProgress] = useState(0);

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
    <div className="min-h-screen bg-black">
      <OfflineIndicator />

      {/* Top Navigation Bar */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/lessons">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-gray-800"
                data-testid="button-back"
              >
                <span className="material-icons">arrow_back</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-white font-semibold text-lg line-clamp-1">{lesson.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize text-xs">
                  {lesson.subject}
                </Badge>
                <Badge variant="outline" className="capitalize text-xs">
                  {lesson.level}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800"
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
        
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">Your progress</span>
            <Progress value={lesson.isCompleted ? 100 : videoProgress} className="flex-1 h-1" />
            <span className="text-white font-medium">{lesson.isCompleted ? 100 : Math.round(videoProgress)}%</span>
          </div>
        </div>
      </header>

      {/* Main Content Area - Video First */}
      <div className="flex flex-col lg:flex-row">
        {/* Video/Content Player Section */}
        <div className="flex-1 bg-black">

          {/* Video Player - Hero Section */}
          {lesson.externalContent && Array.isArray(lesson.externalContent) && lesson.externalContent.length > 0 && (
            <>
              {lesson.externalContent.filter((c: any) => (c.contentType || c.type) === 'video').map((content: any, index: number) => {
                const videoId = content.id?.videoId || content.videoId;
                const videoUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : content.url;
                
                return (
                  <div key={index} className="w-full">
                    <AspectRatio ratio={16 / 9} className="bg-gray-900">
                      <iframe
                        src={videoUrl}
                        title={content.snippet?.title || content.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                        onLoad={() => setVideoProgress(25)}
                      />
                    </AspectRatio>
                  </div>
                );
              }).slice(0, 1)}
            </>
          )}
          
          {/* If no video, show placeholder */}
          {(!lesson.externalContent || !lesson.externalContent.some((c: any) => (c.contentType || c.type) === 'video')) && (
            <div className="w-full">
              <AspectRatio ratio={16 / 9} className="bg-gray-900 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="material-icons text-6xl mb-4">play_circle_outline</span>
                  <p className="text-lg">No video content available</p>
                  <p className="text-sm">Read the lesson content below</p>
                </div>
              </AspectRatio>
            </div>
          )}

          {/* Tabbed Content Section */}
          <div className="bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-border">
                <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                  >
                    <span className="material-icons text-sm mr-2">article</span>
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resources" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                  >
                    <span className="material-icons text-sm mr-2">collections_bookmark</span>
                    Resources
                  </TabsTrigger>
                  {lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0 && (
                    <TabsTrigger 
                      value="quiz" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <span className="material-icons text-sm mr-2">quiz</span>
                      Quiz
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="p-6">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-bold mb-4">About this lesson</h2>
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  </div>
                </div>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="p-6">
                <div className="max-w-3xl space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
                    <p className="text-muted-foreground mb-6">
                      Explore these curated materials to deepen your understanding
                    </p>
                  </div>
                  
                  {lesson.externalContent && lesson.externalContent.length > 0 ? (
                    <div className="grid gap-4">
                      {/* Videos */}
                      {lesson.externalContent.filter((c: any) => (c.contentType || c.type) === 'video').map((content: any, index: number) => {
                        const videoId = content.id?.videoId || content.videoId;
                        
                        return (
                          <Card key={`video-${index}`} className="overflow-hidden">
                            <div className="flex gap-4 p-4">
                              <div className="flex-shrink-0">
                                <div className="w-32 h-20 bg-gray-900 rounded flex items-center justify-center">
                                  <span className="material-icons text-red-500 text-3xl">play_circle</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{content.snippet?.title || content.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {content.snippet?.description || content.description}
                                </p>
                                <Badge variant="secondary" className="mt-2">Video Resource</Badge>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                      
                      {/* Books */}
                      {lesson.externalContent.filter((c: any) => (c.contentType || c.type) === 'book').map((content: any, index: number) => {
                        const bookUrl = content.key ? `https://openlibrary.org${content.key}` : content.url;
                        const authors = content.author_name?.join(', ') || content.author;
                        
                        return (
                          <Card key={`book-${index}`} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="flex gap-4 p-4">
                              <div className="flex-shrink-0">
                                <div className="w-24 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center">
                                  <span className="material-icons text-white text-4xl">menu_book</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{content.title}</h3>
                                {authors && (
                                  <p className="text-sm text-muted-foreground mb-2">by {authors}</p>
                                )}
                                {content.first_publish_year && (
                                  <p className="text-xs text-muted-foreground mb-3">
                                    First published: {content.first_publish_year}
                                  </p>
                                )}
                                <a href={bookUrl} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline">
                                    <span className="material-icons text-sm mr-2">open_in_new</span>
                                    View on Open Library
                                  </Button>
                                </a>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                      
                      {/* Other Resources */}
                      {lesson.externalContent.filter((c: any) => !['video', 'book'].includes(c.contentType || c.type)).map((content: any, index: number) => (
                        <Card key={`other-${index}`} className="overflow-hidden">
                          <CardHeader>
                            <CardTitle className="text-lg">{content.title}</CardTitle>
                            {content.description && (
                              <CardDescription>{content.description}</CardDescription>
                            )}
                          </CardHeader>
                          {content.url && (
                            <CardContent>
                              <a href={content.url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm">
                                  <span className="material-icons text-sm mr-2">open_in_new</span>
                                  Open Resource
                                </Button>
                              </a>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-12 text-center">
                      <span className="material-icons text-muted-foreground text-6xl mb-4">collections_bookmark</span>
                      <p className="text-lg text-muted-foreground">No additional resources available yet</p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Quiz Tab */}
              {lesson.quiz && lesson.quiz.questions && Array.isArray(lesson.quiz.questions) && lesson.quiz.questions.length > 0 && (
                <TabsContent value="quiz" className="p-6">
                  <div className="max-w-3xl">
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-icons text-primary text-3xl">quiz</span>
                              <CardTitle className="text-2xl">Course Quiz</CardTitle>
                            </div>
                            <CardDescription className="text-base">
                              Test your understanding with {lesson.quiz.questions.length} carefully crafted question{lesson.quiz.questions.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                          <Badge className="text-lg px-4 py-2">
                            {lesson.quiz.questions.length} Questions
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <span className="material-icons text-primary">timer</span>
                              <div>
                                <div className="font-medium">Self-paced</div>
                                <div className="text-xs text-muted-foreground">No time limit</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <span className="material-icons text-primary">emoji_events</span>
                              <div>
                                <div className="font-medium">Earn rewards</div>
                                <div className="text-xs text-muted-foreground">Points & badges</div>
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <span className="material-icons text-sm">preview</span>
                              Question Preview
                            </h4>
                            <div className="space-y-3">
                              {lesson.quiz.questions.slice(0, 3).map((q: any, idx: number) => (
                                <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="font-bold text-primary text-sm">{idx + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm line-clamp-2">{q.question}</p>
                                  </div>
                                </div>
                              ))}
                              {lesson.quiz.questions.length > 3 && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  +{lesson.quiz.questions.length - 3} more question{lesson.quiz.questions.length - 3 !== 1 ? 's' : ''} waiting for you
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {lesson.quiz.id && (
                            <Link href={`/quiz/${lesson.quiz.id}`} className="block">
                              <Button size="lg" className="w-full" data-testid="button-take-quiz">
                                <span className="material-icons mr-2">play_arrow</span>
                                Start Quiz Now
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        {/* Right Sidebar - Actions & Info */}
        <div className="lg:w-96 bg-background border-l border-border">
          <div className="sticky top-16 p-6 space-y-6">
            {/* Lesson Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="material-icons text-muted-foreground">category</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Subject</p>
                      <p className="font-medium capitalize">{lesson.subject}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <span className="material-icons text-muted-foreground">signal_cellular_alt</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="font-medium capitalize">{lesson.level}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <span className="material-icons text-muted-foreground">article</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Resources</p>
                      <p className="font-medium">{(lesson.externalContent?.length || 0) + 1} items</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                onClick={() => completeLesson.mutate()}
                disabled={completeLesson.isPending || (lesson.isCompleted === true)}
                data-testid="button-complete-lesson"
              >
                {lesson.isCompleted ? (
                  <>
                    <span className="material-icons mr-2">check_circle</span>
                    Completed
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">task_alt</span>
                    Mark as Complete
                  </>
                )}
              </Button>

              {lesson.quiz?.id && (
                <Link href={`/quiz/${lesson.quiz.id}`} className="block">
                  <Button size="lg" variant="outline" className="w-full" data-testid="button-take-quiz">
                    <span className="material-icons mr-2">quiz</span>
                    Take Quiz
                  </Button>
                </Link>
              )}
              
              <Button
                size="lg"
                variant="ghost"
                className="w-full"
                onClick={handleDownload}
                disabled={offlineCached}
              >
                <span className="material-icons mr-2">
                  {offlineCached ? "cloud_done" : "download"}
                </span>
                {offlineCached ? "Available Offline" : "Download Lesson"}
              </Button>
            </div>

            {/* Completion Status */}
            {lesson.isCompleted && (
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <span className="material-icons text-green-600 dark:text-green-400 text-5xl mb-2">check_circle</span>
                    <p className="font-semibold text-green-900 dark:text-green-100">Lesson Complete!</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">Great work on finishing this lesson</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <StudentBottomNav />
    </div>
  );
}
