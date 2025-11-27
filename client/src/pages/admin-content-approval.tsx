import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminContentApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingLessons, isLoading: pendingLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/lessons", "pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/lessons?status=pending");
      return await res.json();
    },
  });

  const { data: approvedLessons, isLoading: approvedLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/lessons", "approved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/lessons?status=approved");
      return await res.json();
    },
  });

  const { data: allLessons, isLoading: allLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/lessons", "all"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/lessons");
      return await res.json();
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setPreviewOpen(false);
      toast({
        title: "Lesson Approved ✅",
        description: "The lesson is now available to students.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
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

  const renderLessonCard = (lesson: any, showActions = true) => (
    <Card key={lesson.id} className="hover-elevate">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 cursor-pointer" onClick={() => handlePreview(lesson)}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {lesson.subject}
              </Badge>
              <Badge variant="outline">{lesson.level}</Badge>
              {lesson.isApproved && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <span className="material-icons text-xs mr-1">check_circle</span>
                  Approved
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-foreground text-lg hover:text-primary transition-colors">{lesson.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {lesson.description}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              By {lesson.teacherName} • {new Date(lesson.createdAt).toLocaleDateString()}
              {lesson.approverName && ` • Approved by ${lesson.approverName}`}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(lesson);
              }}
            >
              <span className="material-icons mr-2 text-sm">visibility</span>
              View Full Content
            </Button>
          </div>
          {showActions && !lesson.isApproved && (
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
                Approve
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
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Content Approval</h1>
                <p className="text-sm text-muted-foreground">Review and approve lessons from teachers</p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                  <TabsTrigger value="pending">
                    Pending ({pendingLessons?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved ({approvedLessons?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    All ({allLessons?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingLoading ? (
                    <>
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                    </>
                  ) : pendingLessons && pendingLessons.length > 0 ? (
                    pendingLessons.map((lesson: any) => renderLessonCard(lesson))
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
                </TabsContent>

                <TabsContent value="approved" className="space-y-4">
                  {approvedLoading ? (
                    <>
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                    </>
                  ) : approvedLessons && approvedLessons.length > 0 ? (
                    approvedLessons.map((lesson: any) => renderLessonCard(lesson, false))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <span className="material-icons text-muted-foreground text-5xl mb-4">
                          assignment_turned_in
                        </span>
                        <p className="text-muted-foreground">No approved lessons yet</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  {allLoading ? (
                    <>
                      <Skeleton className="h-32" />
                      <Skeleton className="h-32" />
                    </>
                  ) : allLessons && allLessons.length > 0 ? (
                    allLessons.map((lesson: any) => renderLessonCard(lesson, !lesson.isApproved))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <span className="material-icons text-muted-foreground text-5xl mb-4">
                          library_books
                        </span>
                        <p className="text-muted-foreground">No lessons in the system</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Lesson Preview Dialog - Full Review */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <ScrollArea className="h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-3xl mb-3">{selectedLesson?.title}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="capitalize text-sm">
                        <span className="material-icons text-sm mr-1">subject</span>
                        {selectedLesson?.subject}
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        <span className="material-icons text-sm mr-1">school</span>
                        {selectedLesson?.level}
                      </Badge>
                      {selectedLesson?.isApproved ? (
                        <Badge className="bg-green-100 text-green-800 text-sm">
                          <span className="material-icons text-sm mr-1">check_circle</span>
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-sm">
                          <span className="material-icons text-sm mr-1">pending</span>
                          Pending Review
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <DialogDescription className="text-sm text-muted-foreground mt-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-sm">person</span>
                      Created by {selectedLesson?.teacherName}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-sm">calendar_today</span>
                      {new Date(selectedLesson?.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    {selectedLesson?.approverName && (
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="material-icons text-sm">verified</span>
                        Approved by {selectedLesson.approverName}
                      </span>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>

              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-64" />
                  <Skeleton className="h-48" />
                </div>
              ) : selectedLesson && (
                <div className="space-y-8">
                  {/* Overview Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="material-icons">info</span>
                        Course Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Description</h4>
                          <p className="text-foreground leading-relaxed">{selectedLesson.description}</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-muted rounded-lg">
                            <span className="material-icons text-3xl text-primary mb-1">assignment</span>
                            <p className="text-sm font-semibold">Subject</p>
                            <p className="text-xs text-muted-foreground capitalize">{selectedLesson.subject}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <span className="material-icons text-3xl text-primary mb-1">bar_chart</span>
                            <p className="text-sm font-semibold">Level</p>
                            <p className="text-xs text-muted-foreground capitalize">{selectedLesson.level}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <span className="material-icons text-3xl text-primary mb-1">quiz</span>
                            <p className="text-sm font-semibold">Quiz</p>
                            <p className="text-xs text-muted-foreground">
                              {lessonDetails?.quiz ? 'Included' : 'Not Available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lesson Content Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="material-icons">article</span>
                        Lesson Content
                      </CardTitle>
                      <CardDescription>
                        Complete course material and learning resources
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none
                          prose-headings:font-bold prose-headings:text-foreground
                          prose-p:text-foreground prose-p:leading-relaxed
                          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-foreground prose-strong:font-semibold
                          prose-ul:text-foreground prose-ol:text-foreground
                          prose-li:text-foreground prose-li:marker:text-muted-foreground
                          prose-blockquote:border-primary prose-blockquote:text-muted-foreground
                          prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                          prose-pre:bg-muted prose-pre:text-foreground
                          prose-img:rounded-lg prose-img:shadow-md"
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
                        <CardDescription>
                          Additional videos, books, and courses - Click to watch or read
                        </CardDescription>
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
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                      <span className="material-icons text-xs mr-1">menu_book</span>
                                      Book
                                    </Badge>
                                  </div>
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
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                      <span className="material-icons text-xs mr-1">school</span>
                                      Course
                                    </Badge>
                                  </div>
                                  <h4 className="font-semibold text-base mb-1">{resource.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {resource.description || 'Educational course material'}
                                  </p>
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

                  {/* Teacher Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="material-icons">person</span>
                        Submitted By
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                          {selectedLesson.teacherName?.charAt(0) || 'T'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{selectedLesson.teacherName}</p>
                          <p className="text-sm text-muted-foreground">Teacher</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Submitted on</p>
                          <p className="text-sm font-semibold">
                            {new Date(selectedLesson.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  {!selectedLesson.isApproved && (
                    <Card className="border-2 border-dashed">
                      <CardContent className="py-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">Ready to make a decision?</h4>
                            <p className="text-sm text-muted-foreground">
                              Approve this lesson to make it available to students, or reject with feedback.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              size="lg"
                              onClick={() => approveMutation.mutate(selectedLesson.id)}
                              disabled={approveMutation.isPending}
                              className="min-w-[140px]"
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
                              className="min-w-[140px]"
                            >
                              <span className="material-icons mr-2">cancel</span>
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Reject Lesson Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Lesson</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedLesson?.title}". 
              This feedback will be sent to the teacher via email and notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Content does not meet quality standards, missing required sections, or needs more detailed explanations..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific and constructive to help the teacher improve their content.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <span className="material-icons mr-2 animate-spin">refresh</span>
                  Rejecting...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">close</span>
                  Reject Lesson
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
