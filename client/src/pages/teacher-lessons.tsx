import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

export default function TeacherLessons() {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["/api/teacher/my-lessons"],
  });

  // Fetch lesson details with quiz and external content
  const { data: lessonDetails, isLoading: detailsLoading } = useQuery<any>({
    queryKey: ["/api/lessons", selectedLesson?.id],
    queryFn: async () => {
      if (!selectedLesson?.id) return null;
      const res = await apiRequest("GET", `/api/lessons/${selectedLesson.id}`);
      return await res.json();
    },
    enabled: !!selectedLesson?.id && previewOpen,
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Filter lessons by current teacher (you might need to adjust based on your backend)
  const myLessons = Array.isArray(lessons) ? lessons : [];

  const handlePreview = (lesson: any) => {
    setSelectedLesson(lesson);
    setPreviewOpen(true);
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="teacher" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <OfflineIndicator />

          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Lessons</h1>
                <p className="text-sm text-muted-foreground">Manage your lesson content</p>
              </div>
            </div>
            <Link href="/teacher/lessons/new">
              <Button>
                <span className="material-icons mr-2 text-lg">add</span>
                Create Lesson
              </Button>
            </Link>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : myLessons.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <span className="material-icons text-muted-foreground text-6xl mb-4">menu_book</span>
                    <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first lesson to get started</p>
                    <Link href="/teacher/lessons/new">
                      <Button>
                        <span className="material-icons mr-2">add</span>
                        Create Lesson
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myLessons.map((lesson: any) => (
                        <TableRow key={lesson.id}>
                          <TableCell className="font-medium">{lesson.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {lesson.subject}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{lesson.level}</TableCell>
                          <TableCell>
                            {lesson.isApproved ? (
                              <Badge variant="default">
                                <span className="material-icons text-xs mr-1">check_circle</span>
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <span className="material-icons text-xs mr-1">pending</span>
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{new Date(lesson.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePreview(lesson)}
                              >
                                <span className="material-icons text-lg">visibility</span>
                              </Button>
                              <Link href={`/teacher/lessons/${lesson.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  <span className="material-icons text-lg">edit</span>
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Lesson Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[75vh]">
            <div className="p-6">
              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-64" />
                </div>
              ) : selectedLesson && (
                <div className="space-y-6">
                  {/* Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="material-icons">info</span>
                        Course Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{selectedLesson.description}</p>
                      <Separator className="my-4" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="material-icons text-3xl text-primary">assignment</span>
                          <p className="text-sm font-semibold mt-2">Subject</p>
                          <p className="text-xs text-muted-foreground capitalize">{selectedLesson.subject}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="material-icons text-3xl text-primary">bar_chart</span>
                          <p className="text-sm font-semibold mt-2">Level</p>
                          <p className="text-xs text-muted-foreground capitalize">{selectedLesson.level}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="material-icons text-3xl text-primary">quiz</span>
                          <p className="text-sm font-semibold mt-2">Quiz</p>
                          <p className="text-xs text-muted-foreground">
                            {lessonDetails?.quiz ? 'Included' : 'Not Available'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Content */}
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

                  {/* External Resources */}
                  {lessonDetails?.externalContent && lessonDetails.externalContent.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="material-icons">video_library</span>
                          External Resources
                        </CardTitle>
                        <CardDescription>Videos, books, and courses</CardDescription>
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
                              <div className="flex gap-4 p-4 border rounded-lg">
                                <div className="w-20 h-28 bg-muted rounded flex items-center justify-center">
                                  <span className="material-icons text-4xl text-muted-foreground">menu_book</span>
                                </div>
                                <div className="flex-1">
                                  <Badge variant="outline" className="mb-2">
                                    <span className="material-icons text-xs mr-1">menu_book</span>
                                    Book
                                  </Badge>
                                  <h4 className="font-semibold">{resource.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    By {resource.author_name?.[0] || 'Unknown'}
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
                              <div className="flex gap-4 p-4 border rounded-lg">
                                <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center">
                                  <span className="material-icons text-3xl text-primary">school</span>
                                </div>
                                <div className="flex-1">
                                  <Badge variant="outline" className="mb-2">
                                    <span className="material-icons text-xs mr-1">school</span>
                                    Course
                                  </Badge>
                                  <h4 className="font-semibold">{resource.title}</h4>
                                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Quiz */}
                  {lessonDetails?.quiz && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="material-icons">quiz</span>
                          Assessment Quiz
                        </CardTitle>
                        <CardDescription>
                          {lessonDetails.quiz.questions?.length || 0} questions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {lessonDetails.quiz.questions?.map((question: any, index: number) => (
                            <div key={index} className="border-l-4 border-primary pl-4 py-2">
                              <div className="flex items-start gap-3 mb-3">
                                <Badge variant="outline">Q{index + 1}</Badge>
                                <p className="font-medium flex-1">{question.question}</p>
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
                                          Correct
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
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
