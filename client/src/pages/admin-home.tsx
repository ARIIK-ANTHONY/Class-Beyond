import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NotificationBell } from "@/components/notification-bell";

export default function AdminHome() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalUsers?: number;
    activeThisWeek?: number;
    totalLessons?: number;
    pendingApproval?: number;
    totalQuizzes?: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: pendingApprovals } = useQuery<any[]>({
    queryKey: ["/api/admin/pending-approvals"],
  });

  // Fetch lesson details with quiz when preview opens
  const { data: lessonDetails, isLoading: detailsLoading } = useQuery<any>({
    queryKey: ["/api/lessons", selectedLesson?.id],
    queryFn: async () => {
      if (!selectedLesson?.id) return null;
      const res = await apiRequest("GET", `/api/lessons/${selectedLesson.id}`);
      return await res.json();
    },
    enabled: !!selectedLesson?.id && previewOpen,
  });

  const approveMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const res = await apiRequest("PATCH", `/api/admin/lessons/${lessonId}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Lesson Approved",
        description: "The lesson has been approved and is now available to students.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ lessonId, reason }: { lessonId: string; reason: string }) => {
      const res = await apiRequest("DELETE", `/api/admin/lessons/${lessonId}/reject`, {
        body: JSON.stringify({ reason }),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setPreviewOpen(false);
      setRejectDialogOpen(false);
      setRejectionReason("");
      toast({
        title: "Lesson Rejected ❌",
        description: "The teacher has been notified with your feedback.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePreview = (lesson: any) => {
    setSelectedLesson(lesson);
    setPreviewOpen(true);
  };

  const handleRejectClick = (lesson: any) => {
    setSelectedLesson(lesson);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedLesson) {
      rejectMutation.mutate({ 
        lessonId: selectedLesson.id, 
        reason: rejectionReason 
      });
    }
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
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
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Platform management and analytics</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              {/* System Stats */}
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-foreground">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                    </>
                  ) : (
                    <>
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Total Users</CardDescription>
                            <span className="material-icons text-primary">people</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-users">
                            {stats?.totalUsers || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stats?.activeThisWeek || 0} active this week
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Total Lessons</CardDescription>
                            <span className="material-icons text-primary">menu_book</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-lessons">
                            {stats?.totalLessons || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stats?.pendingApproval || 0} pending approval
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Quiz Completions</CardDescription>
                            <span className="material-icons text-primary">quiz</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold" data-testid="stat-quizzes">
                            {stats?.totalQuizzes || 0}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">This month</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription>Platform Health</CardDescription>
                            <span className="material-icons text-primary">health_and_safety</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-green-600">Healthy</p>
                          <p className="text-sm text-muted-foreground mt-1">All systems operational</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </section>

              {/* Pending Approvals */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Pending Content Approval</h2>
                  <Link href="/admin/approval">
                    <Button variant="ghost" size="sm" data-testid="button-view-all-approvals">
                      View All
                    </Button>
                  </Link>
                </div>

                {pendingApprovals && pendingApprovals.length > 0 ? (
                  <div className="space-y-3">
                    {pendingApprovals.slice(0, 5).map((lesson: any) => (
                      <Card key={lesson.id} className="hover-elevate">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 cursor-pointer" onClick={() => handlePreview(lesson)}>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="capitalize">
                                  {lesson.subject}
                                </Badge>
                                <Badge variant="outline">{lesson.level}</Badge>
                              </div>
                              <p className="font-medium text-foreground hover:text-primary transition-colors">{lesson.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                By {lesson.teacherName} • {new Date(lesson.createdAt).toLocaleDateString()}
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreview(lesson);
                                }}
                              >
                                <span className="material-icons mr-2 text-sm">visibility</span>
                                View Full Content
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveMutation.mutate(lesson.id);
                                }}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${lesson.id}`}
                              >
                                <span className="material-icons mr-1 text-lg">check</span>
                                {approveMutation.isPending ? "Approving..." : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectClick(lesson);
                                }}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${lesson.id}`}
                              >
                                <span className="material-icons mr-1 text-lg">close</span>
                                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <span className="material-icons text-muted-foreground text-5xl mb-4">
                        check_circle
                      </span>
                      <p className="text-muted-foreground">No pending approvals</p>
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* Preview Modal - Same as Content Approval page */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <ScrollArea className="h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl">{selectedLesson?.title}</DialogTitle>
                <DialogDescription>
                  Review the complete course content before making a decision
                </DialogDescription>
              </DialogHeader>

              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-64" />
                </div>
              ) : selectedLesson && (
                <div className="space-y-6">
                  {/* Course Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="material-icons">info</span>
                        Course Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="material-icons text-2xl text-primary">assignment</span>
                          <p className="text-sm font-semibold mt-1">Subject</p>
                          <p className="text-xs text-muted-foreground capitalize">{selectedLesson.subject}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="material-icons text-2xl text-primary">school</span>
                          <p className="text-sm font-semibold mt-1">Level</p>
                          <p className="text-xs text-muted-foreground capitalize">{selectedLesson.level}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="material-icons text-2xl text-primary">quiz</span>
                          <p className="text-sm font-semibold mt-1">Quiz</p>
                          <p className="text-xs text-muted-foreground">
                            {lessonDetails?.quiz ? 'Included' : 'Not Available'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lesson Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="material-icons">article</span>
                        Lesson Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                      />
                    </CardContent>
                  </Card>

                  {/* External Resources Section */}
                  {lessonDetails?.externalContent && lessonDetails.externalContent.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="material-icons">video_library</span>
                          External Resources
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {lessonDetails.externalContent.map((resource: any, index: number) => (
                          <div key={index}>
                            {resource.contentType === 'video' && resource.id?.videoId && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    <span className="material-icons text-xs mr-1">play_circle</span>
                                    Video
                                  </Badge>
                                  <h4 className="font-semibold text-sm">{resource.snippet?.title}</h4>
                                </div>
                                {/* Embedded YouTube Player */}
                                <div className="relative w-full rounded-lg overflow-hidden shadow-md" style={{ paddingBottom: '56.25%' }}>
                                  <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/${resource.id.videoId}`}
                                    title={resource.snippet?.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {resource.snippet?.description}
                                </p>
                              </div>
                            )}
                            {resource.contentType === 'book' && (
                              <div className="flex gap-4 p-4 border rounded-lg hover:border-primary transition-colors">
                                <div className="w-20 h-28 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                  <span className="material-icons text-4xl text-muted-foreground">menu_book</span>
                                </div>
                                <div className="flex-1">
                                  <Badge variant="outline" className="mb-2">
                                    <span className="material-icons text-xs mr-1">menu_book</span>
                                    Book
                                  </Badge>
                                  <h4 className="font-semibold text-base mb-1">{resource.title}</h4>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    By {resource.author_name?.[0] || 'Unknown Author'}
                                  </p>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Published: {resource.first_publish_year || 'N/A'}
                                  </p>
                                  {resource.key && (
                                    <Button 
                                      variant="default"
                                      size="sm"
                                      onClick={() => window.open(`https://openlibrary.org${resource.key}`, '_blank')}
                                    >
                                      <span className="material-icons text-sm mr-1">open_in_new</span>
                                      Read on Open Library
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                            {resource.contentType === 'course' && (
                              <div className="flex gap-4 p-4 border rounded-lg hover:border-primary transition-colors">
                                <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                                  <span className="material-icons text-3xl text-primary">school</span>
                                </div>
                                <div className="flex-1">
                                  <Badge variant="outline" className="mb-2">
                                    <span className="material-icons text-xs mr-1">school</span>
                                    Course
                                  </Badge>
                                  <h4 className="font-semibold text-base mb-1">{resource.title}</h4>
                                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Quiz Section */}
                  {lessonDetails?.quiz && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="material-icons">quiz</span>
                          Assessment Quiz
                        </CardTitle>
                        <CardDescription>
                          {lessonDetails.quiz.questions?.length || 0} questions to test student understanding
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {lessonDetails.quiz.questions?.map((question: any, index: number) => (
                            <div key={index} className="border-l-4 border-primary pl-4 py-2">
                              <div className="flex items-start gap-3 mb-3">
                                <Badge variant="outline" className="mt-0.5">Q{index + 1}</Badge>
                                <p className="font-medium text-foreground flex-1">{question.question}</p>
                              </div>
                              
                              <div className="space-y-2 ml-10">
                                {question.options?.map((option: string, optIndex: number) => (
                                  <div 
                                    key={optIndex}
                                    className={`p-3 rounded-lg border ${
                                      optIndex === question.correctAnswer
                                        ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700'
                                        : 'bg-muted border-border'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm font-semibold">
                                        {String.fromCharCode(65 + optIndex)}.
                                      </span>
                                      <span className={optIndex === question.correctAnswer ? 'font-semibold' : ''}>
                                        {option}
                                      </span>
                                      {optIndex === question.correctAnswer && (
                                        <Badge variant="default" className="ml-auto bg-green-600">
                                          <span className="material-icons text-xs mr-1">check</span>
                                          Correct Answer
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  {!selectedLesson.isApproved && (
                    <div className="flex gap-3 justify-end">
                      <Button
                        size="lg"
                        onClick={() => {
                          approveMutation.mutate(selectedLesson.id);
                          setPreviewOpen(false);
                        }}
                        disabled={approveMutation.isPending}
                      >
                        <span className="material-icons mr-2">check_circle</span>
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={() => {
                          setPreviewOpen(false);
                          handleRejectClick(selectedLesson);
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <span className="material-icons mr-2">cancel</span>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Lesson</DialogTitle>
            <DialogDescription>
              Please provide detailed feedback to help the teacher improve their content.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain what needs to be improved (grammar, content quality, missing information, etc.)..."
              className="min-h-[120px] mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectConfirm}
              variant="destructive"
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Sending..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
