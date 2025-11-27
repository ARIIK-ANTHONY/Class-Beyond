import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { MessageSquare, ThumbsUp, CheckCircle2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Answer {
  id: number;
  questionId: number;
  userId: number;
  userName: string;
  userRole: "mentor" | "student";
  answer: string;
  upvotes: number;
  isAccepted: boolean;
  createdAt: string;
}

interface ForumQuestion {
  id: number;
  studentId: number;
  studentName: string;
  subject: string;
  question: string;
  answers: Answer[];
  createdAt: string;
}

export default function StudentForum() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null);
  
  // Ask question form state
  const [subject, setSubject] = useState("");
  const [questionText, setQuestionText] = useState("");
  
  // Answer form state
  const [answerText, setAnswerText] = useState("");

  // Fetch all questions
  const { data: questions = [] } = useQuery<ForumQuestion[]>({
    queryKey: ["/api/forum/questions"],
  });

  // Fetch student's own questions
  const { data: myQuestions = [] } = useQuery<ForumQuestion[]>({
    queryKey: ["/api/forum/my-questions"],
  });

  // Post new question mutation
  const { firebaseUser } = useAuth();
  const askQuestionMutation = useMutation({
    mutationFn: async (data: { subject: string; question: string }) => {
      let token = null;
      if (firebaseUser) {
        token = await firebaseUser.getIdToken();
      }
      const res = await fetch("/api/forum/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to post question");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/my-questions"] });
      toast({
        title: "Question Posted",
        description: "Your question has been posted successfully!",
      });
      setAskDialogOpen(false);
      setSubject("");
      setQuestionText("");
    },
  });

  // Post answer mutation
  const postAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: number; answer: string }) => {
      const res = await fetch(`/api/forum/questions/${data.questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: data.answer }),
      });
      if (!res.ok) throw new Error("Failed to post answer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/my-questions"] });
      toast({
        title: "Answer Posted",
        description: "Your answer has been posted successfully!",
      });
      setAnswerText("");
      setViewDialogOpen(false);
    },
  });

  // Accept answer mutation
  const acceptAnswerMutation = useMutation({
    mutationFn: async (answerId: number) => {
      const res = await fetch(`/api/forum/answers/${answerId}/accept`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to accept answer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/my-questions"] });
      toast({
        title: "Answer Accepted",
        description: "You've marked this answer as accepted!",
      });
    },
  });

  // Upvote answer mutation
  const upvoteAnswerMutation = useMutation({
    mutationFn: async (answerId: number) => {
      const res = await fetch(`/api/forum/answers/${answerId}/upvote`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to upvote answer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/my-questions"] });
    },
  });

  const handleAskQuestion = () => {
    if (!subject.trim() || !questionText.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    askQuestionMutation.mutate({
      subject,
      question: questionText,
    });
  };

  const handlePostAnswer = () => {
    if (!answerText.trim() || !selectedQuestion) return;

    postAnswerMutation.mutate({
      questionId: selectedQuestion.id,
      answer: answerText,
    });
  };

  const openQuestionDialog = (question: ForumQuestion) => {
    setSelectedQuestion(question);
    setViewDialogOpen(true);
    setAnswerText("");
  };

  const handleAcceptAnswer = (answerId: number) => {
    acceptAnswerMutation.mutate(answerId);
  };

  const handleUpvoteAnswer = (answerId: number) => {
    upvoteAnswerMutation.mutate(answerId);
  };

  const allQuestions = questions;
  const answeredQuestions = questions.filter(q => q.answers.length > 0);
  const unansweredQuestions = questions.filter(q => q.answers.length === 0);

  const renderQuestionCard = (question: ForumQuestion) => {
    const hasAcceptedAnswer = question.answers.some(a => a.isAccepted);
    // Use 'content' as the question text if present
    const questionText = (question as any).content || question.question;
    return (
      <Card 
        key={question.id} 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => openQuestionDialog(question)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{question.subject}</Badge>
                {hasAcceptedAnswer && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Answered
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base font-medium">
                {questionText}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Asked by {question.studentName}</span>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{question.answers.length} {question.answers.length === 1 ? 'answer' : 'answers'}</span>
              </div>
            </div>
            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

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
                <h1 className="text-2xl font-bold text-foreground">Q&A Forum</h1>
                <p className="text-sm text-muted-foreground">Ask questions and get help from mentors and peers</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
          <div className="flex justify-end items-center mb-6">
            <Button onClick={() => setAskDialogOpen(true)}>
              Ask Question
            </Button>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Questions</TabsTrigger>
              <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
              <TabsTrigger value="answered">Answered</TabsTrigger>
              <TabsTrigger value="my-questions">My Questions</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {allQuestions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No questions yet. Be the first to ask!
                  </CardContent>
                </Card>
              ) : (
                allQuestions.map(renderQuestionCard)
              )}
            </TabsContent>

            <TabsContent value="unanswered" className="space-y-4">
              {unansweredQuestions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    All questions have been answered!
                  </CardContent>
                </Card>
              ) : (
                unansweredQuestions.map(renderQuestionCard)
              )}
            </TabsContent>

            <TabsContent value="answered" className="space-y-4">
              {answeredQuestions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No answered questions yet.
                  </CardContent>
                </Card>
              ) : (
                answeredQuestions.map(renderQuestionCard)
              )}
            </TabsContent>

            <TabsContent value="my-questions" className="space-y-4">
              {myQuestions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    You haven't asked any questions yet.
                  </CardContent>
                </Card>
              ) : (
                myQuestions.map(renderQuestionCard)
              )}
            </TabsContent>
          </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Ask Question Dialog */}
          <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ask a Question</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="question">Your Question</Label>
                  <Textarea
                    id="question"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Describe your question in detail..."
                    rows={8}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Be specific and provide context to help others understand your question better.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAskDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAskQuestion}>
                  Post Question
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Question and Answers Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              {selectedQuestion && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{selectedQuestion.subject}</Badge>
                    </div>
                    <DialogTitle className="text-xl">{selectedQuestion.question}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Asked by {selectedQuestion.studentName} on {new Date(selectedQuestion.createdAt).toLocaleDateString()}
                    </p>
                  </DialogHeader>

                  <div className="space-y-6 mt-6">
                    {/* Existing Answers */}
                    {selectedQuestion.answers.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">
                          {selectedQuestion.answers.length} {selectedQuestion.answers.length === 1 ? 'Answer' : 'Answers'}
                        </h3>
                        <div className="space-y-4">
                          {selectedQuestion.answers.map((answer) => (
                            <Card key={answer.id} className={answer.isAccepted ? "border-green-500 border-2" : ""}>
                              <CardContent className="pt-4">
                                <div className="flex gap-4">
                                  <div className="flex flex-col items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpvoteAnswer(answer.id)}
                                    >
                                      <ThumbsUp className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm font-semibold">{answer.upvotes}</span>
                                    {answer.isAccepted && (
                                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm whitespace-pre-wrap mb-3">{answer.answer}</p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={answer.userRole === "mentor" ? "default" : "secondary"}>
                                          {answer.userRole === "mentor" ? "Mentor" : "Student"}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                          {answer.userName}
                                        </span>
                                      </div>
                                      {!answer.isAccepted && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleAcceptAnswer(answer.id)}
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-1" />
                                          Accept Answer
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Answer Section */}
                    <div>
                      <h3 className="font-semibold mb-3">Your Answer</h3>
                      <Textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Share your knowledge and help others..."
                        rows={6}
                      />
                      <Button 
                        className="mt-3" 
                        onClick={handlePostAnswer}
                        disabled={!answerText.trim()}
                      >
                        Post Answer
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
    </SidebarProvider>
  );
}
