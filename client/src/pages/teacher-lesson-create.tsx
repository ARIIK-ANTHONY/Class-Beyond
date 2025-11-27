import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ExternalContentBrowser } from "@/components/external-content-browser";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function TeacherLessonCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Lesson form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<"math" | "english" | "science">("math");
  const [level, setLevel] = useState("beginner");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  // Quiz state
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentOptions, setCurrentOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  // External content state
  const [externalContent, setExternalContent] = useState<any[]>([]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lesson");
      }

      return response.json();
    },
    onSuccess: async (lesson) => {
      // If quiz is included, create it
      if (includeQuiz && questions.length > 0) {
        await createQuizMutation.mutateAsync({
          lessonId: lesson.id,
          title: quizTitle || `${title} Quiz`,
          questions: questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        });
      } else {
        toast({
          title: "Success!",
          description: "Lesson created successfully and sent for admin approval.",
        });
        navigate("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/teacher/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create quiz");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Lesson and quiz created successfully!",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddQuestion = () => {
    if (!currentQuestion.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    if (currentOptions.some((opt) => !opt.trim())) {
      toast({
        title: "Error",
        description: "All answer options must be filled",
        variant: "destructive",
      });
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      question: currentQuestion,
      options: currentOptions,
      correctAnswer,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion("");
    setCurrentOptions(["", "", "", ""]);
    setCorrectAnswer(0);

    toast({
      title: "Question added",
      description: `Question ${questions.length + 1} added successfully`,
    });
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleAddExternalContent = (content: any) => {
    setExternalContent([...externalContent, content]);
    toast({
      title: "Content Added",
      description: `${content.contentType} added to your lesson resources`,
    });
  };

  const handleRemoveExternalContent = (index: number) => {
    setExternalContent(externalContent.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (includeQuiz && questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one quiz question or uncheck 'Include Quiz'",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    const lessonData = {
      title,
      subject,
      level,
      description,
      content,
      teacherId: user.id,
      externalContent: externalContent.length > 0 ? externalContent : undefined,
    };
    
    console.log("🚀 Sending lesson data:", lessonData);

    createLessonMutation.mutate(lessonData);
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
                <h1 className="text-2xl font-bold text-foreground">Create New Lesson</h1>
                <p className="text-sm text-muted-foreground">Design engaging content for your students</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              <span className="material-icons mr-2 text-lg">close</span>
              Cancel
            </Button>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Provide the essential details about your lesson</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Lesson Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Introduction to Algebra"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Select value={subject} onValueChange={(value: any) => setSubject(value)}>
                        <SelectTrigger id="subject">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="math">Mathematics</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="level">Difficulty Level *</Label>
                      <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger id="level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief overview of what students will learn..."
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Lesson Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Content</CardTitle>
                  <CardDescription>Write the main content of your lesson</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your lesson content here... You can include explanations, examples, and step-by-step instructions."
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Use clear headings, bullet points, and examples to make your lesson easy to follow
                  </p>
                </CardContent>
              </Card>

              {/* External Resources Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>External Resources (Optional)</CardTitle>
                      <CardDescription>Enhance your lesson with videos, books, and courses</CardDescription>
                    </div>
                    <ExternalContentBrowser onSelect={handleAddExternalContent} />
                  </div>
                </CardHeader>
                {externalContent.length > 0 && (
                  <CardContent>
                    <div className="space-y-3">
                      {externalContent.map((content, index) => (
                        <Card key={index} className="border-l-4 border-l-primary">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="capitalize">
                                    <span className="material-icons text-xs mr-1">
                                      {content.contentType === "video"
                                        ? "play_circle"
                                        : content.contentType === "book"
                                        ? "menu_book"
                                        : "school"}
                                    </span>
                                    {content.contentType}
                                  </Badge>
                                </div>
                                <p className="font-medium text-sm">
                                  {content.snippet?.title || content.title}
                                </p>
                                {content.snippet?.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {content.snippet.description}
                                  </p>
                                )}
                                {content.author_name && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    By: {content.author_name[0]}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveExternalContent(index)}
                              >
                                <span className="material-icons text-destructive">delete</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Quiz Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Assessment Quiz (Optional)</CardTitle>
                      <CardDescription>Add questions to test student understanding</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant={includeQuiz ? "default" : "outline"}
                      onClick={() => setIncludeQuiz(!includeQuiz)}
                    >
                      <span className="material-icons mr-2 text-lg">
                        {includeQuiz ? "check_box" : "check_box_outline_blank"}
                      </span>
                      Include Quiz
                    </Button>
                  </div>
                </CardHeader>

                {includeQuiz && (
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="quizTitle">Quiz Title</Label>
                      <Input
                        id="quizTitle"
                        placeholder="e.g., Algebra Basics Assessment"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                      />
                    </div>

                    <Separator />

                    {/* Existing Questions */}
                    {questions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <span className="material-icons text-primary">quiz</span>
                          Questions ({questions.length})
                        </h4>
                        {questions.map((q, index) => (
                          <Card key={q.id} className="border-l-4 border-l-primary">
                            <CardContent className="py-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <p className="font-medium mb-2">
                                    {index + 1}. {q.question}
                                  </p>
                                  <div className="space-y-1">
                                    {q.options.map((opt, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm">
                                        <Badge variant={i === q.correctAnswer ? "default" : "outline"}>
                                          {String.fromCharCode(65 + i)}
                                        </Badge>
                                        <span>{opt}</span>
                                        {i === q.correctAnswer && (
                                          <span className="material-icons text-green-600 text-sm">check_circle</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveQuestion(q.id)}
                                >
                                  <span className="material-icons text-destructive">delete</span>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Separator />
                      </div>
                    )}

                    {/* Add New Question */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Add New Question</h4>

                      <div>
                        <Label htmlFor="question">Question Text</Label>
                        <Input
                          id="question"
                          placeholder="What is 2 + 2?"
                          value={currentQuestion}
                          onChange={(e) => setCurrentQuestion(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Answer Options</Label>
                        {currentOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline">{String.fromCharCode(65 + index)}</Badge>
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...currentOptions];
                                newOptions[index] = e.target.value;
                                setCurrentOptions(newOptions);
                              }}
                            />
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={correctAnswer === index}
                              onChange={() => setCorrectAnswer(index)}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">Select the correct answer using the radio button</p>
                      </div>

                      <Button type="button" variant="outline" onClick={handleAddQuestion} className="w-full">
                        <span className="material-icons mr-2">add</span>
                        Add Question
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Submit */}
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Your lesson will be sent to admin for approval before being published to students.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={createLessonMutation.isPending || createQuizMutation.isPending}
                    >
                      {createLessonMutation.isPending || createQuizMutation.isPending ? (
                        <>
                          <span className="material-icons mr-2 animate-spin">refresh</span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <span className="material-icons mr-2">send</span>
                          Submit for Approval
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
