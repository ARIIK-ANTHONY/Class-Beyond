import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface ForumQuestion {
  id: string;
  studentName: string;
  subject: string;
  question: string;
  answers: number;
  createdAt: string;
  isAnswered: boolean;
}

interface Answer {
  id: string;
  mentorName: string;
  answer: string;
  createdAt: string;
  isAccepted: boolean;
}

export default function MentorForum() {
  const { toast } = useToast();
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [answerText, setAnswerText] = useState("");

  // Fetch real questions from backend
  const { data: questions = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/forum/questions"],
  });

  const handleSubmitAnswer = () => {
    if (!answerText.trim()) {
      toast({
        title: "Empty answer",
        description: "Please write an answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement backend mutation
    toast({
      title: "Answer submitted",
      description: "Your answer has been posted successfully.",
    });
    setAnswerDialogOpen(false);
    setAnswerText("");
    setSelectedQuestion(null);
  };

  const openAnswerDialog = (question: ForumQuestion) => {
    setSelectedQuestion(question);
    setAnswerDialogOpen(true);
  };

  // Map backend data to expected format
  const mappedQuestions = questions.map(q => ({
    id: q.id,
    studentName: q.studentName,
    subject: q.subject,
    question: q.content || q.question,
    answers: q.answers?.length || 0,
    createdAt: q.createdAt,
    isAnswered: q.answers?.some((a: any) => a.isAccepted) || false,
  }));

  const unansweredQuestions = mappedQuestions.filter(q => !q.isAnswered);
  const answeredQuestions = mappedQuestions.filter(q => q.isAnswered);
  const myAnswers = mappedQuestions.filter(q => q.answers > 0); // Placeholder

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full" style={style as any}>
        <AppSidebar role="mentor" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Q&A Forum</h1>
              <p className="text-sm text-muted-foreground">Help students by answering their questions</p>
            </div>
            <NotificationBell />
            <OfflineIndicator />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="unanswered" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="unanswered">
                    Unanswered {unansweredQuestions.length > 0 && `(${unansweredQuestions.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="answered">
                    Answered {answeredQuestions.length > 0 && `(${answeredQuestions.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="my-answers">
                    My Answers
                  </TabsTrigger>
                </TabsList>

                {/* Unanswered Questions */}
                <TabsContent value="unanswered" className="mt-6">
                  {unansweredQuestions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <span className="material-icons text-muted-foreground text-5xl mb-4">forum</span>
                        <p className="text-muted-foreground">No unanswered questions at the moment</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {unansweredQuestions.map((question) => (
                        <Card key={question.id} className="hover-elevate">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                <span className="text-2xl font-bold text-muted-foreground">{question.answers}</span>
                                <span className="text-xs text-muted-foreground">answers</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge variant="secondary" className="capitalize">
                                    {question.subject}
                                  </Badge>
                                  <Badge variant="outline">Needs Answer</Badge>
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{question.question}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="material-icons text-sm">person</span>
                                  <span>{question.studentName}</span>
                                  <span>•</span>
                                  <span>{new Date(question.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => openAnswerDialog(question)}
                              >
                                <span className="material-icons mr-1 text-lg">reply</span>
                                Answer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Answered Questions */}
                <TabsContent value="answered" className="mt-6">
                  {answeredQuestions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <span className="material-icons text-muted-foreground text-5xl mb-4">check_circle</span>
                        <p className="text-muted-foreground">No answered questions yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {answeredQuestions.map((question) => (
                        <Card key={question.id}>
                          <CardContent className="py-4">
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                <span className="material-icons text-2xl text-green-500">check_circle</span>
                                <span className="text-xs text-muted-foreground">{question.answers} answers</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge variant="secondary" className="capitalize">
                                    {question.subject}
                                  </Badge>
                                  <Badge className="bg-green-500">Answered</Badge>
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{question.question}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="material-icons text-sm">person</span>
                                  <span>{question.studentName}</span>
                                  <span>•</span>
                                  <span>{new Date(question.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric'
                                  })}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAnswerDialog(question)}
                              >
                                <span className="material-icons mr-1 text-lg">visibility</span>
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* My Answers */}
                <TabsContent value="my-answers" className="mt-6">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <span className="material-icons text-muted-foreground text-5xl mb-4">rate_review</span>
                      <p className="text-muted-foreground mb-2">Your answer history will appear here</p>
                      <p className="text-sm text-muted-foreground">
                        Start helping students by answering their questions!
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Answer Dialog */}
      <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Answer Question</DialogTitle>
            <DialogDescription>
              Provide a helpful answer to {selectedQuestion?.studentName}'s question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedQuestion && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{selectedQuestion.subject}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Asked by {selectedQuestion.studentName}
                  </span>
                </div>
                <p className="text-sm font-medium">{selectedQuestion.question}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Answer</label>
              <Textarea
                placeholder="Write a detailed answer to help the student..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be clear, detailed, and encouraging in your response
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setAnswerDialogOpen(false);
              setAnswerText("");
              setSelectedQuestion(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAnswer}
              disabled={!answerText.trim()}
            >
              <span className="material-icons mr-1 text-lg">send</span>
              Submit Answer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
