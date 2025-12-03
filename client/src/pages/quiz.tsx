import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trophy } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Quiz() {
  const [, params] = useRoute("/quiz/:id");
  const [, setLocation] = useLocation();
  const quizId = params?.id;
  const { toast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [detailedResults, setDetailedResults] = useState<any[]>([]);
  const [badgesEarned, setBadgesEarned] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [quizStartTime] = useState(Date.now());

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (submission: { quizId: string; answers: any[]; score: number; totalQuestions: number; completionTime: number }) => {
      const response = await apiRequest("POST", "/api/student/submit-quiz", submission);
      return response;
    },
    onSuccess: (data: any) => {
      // Store newly earned badges
      if (data.newlyEarnedBadges && data.newlyEarnedBadges.length > 0) {
        setBadgesEarned(data.newlyEarnedBadges);
        // Show toast for each badge
        data.newlyEarnedBadges.forEach((badge: any) => {
          toast({
            title: "🎉 Badge Earned!",
            description: `You earned the "${badge.name}" badge!`,
            duration: 5000,
          });
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/badges"] });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-full max-w-2xl h-96" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <span className="material-icons text-muted-foreground text-6xl mb-4">quiz</span>
            <p className="text-lg font-medium mb-2">Quiz not found</p>
            <Link href="/lessons">
              <Button>Browse Lessons</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = quiz.questions as any[];
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    let correctAnswers = 0;
    const answersArray = questions.map((q, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        questionIndex: idx,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    const calculatedScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(calculatedScore);
    setDetailedResults(answersArray);
    setShowResults(true);
    
    // Calculate completion time in seconds
    const completionTime = Math.floor((Date.now() - quizStartTime) / 1000);
    // Trigger celebration animation for good scores
    if (calculatedScore >= 80) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }

    submitQuizMutation.mutate({
      quizId: quizId!,
      answers: answersArray,
      score: calculatedScore,
      totalQuestions: questions.length,
      completionTime,
    });
  };

  if (showResults) {
    const correctCount = detailedResults.filter(r => r.isCorrect).length;
    const incorrectCount = questions.length - correctCount;
    const passingScore = score >= 70;
    
    return (
      <div className="min-h-screen bg-background">
        <OfflineIndicator />
        
        {/* Celebration Animation */}
        {showCelebration && score >= 80 && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="animate-bounce">
              <span className="material-icons text-yellow-500" style={{ fontSize: '120px' }}>
                emoji_events
              </span>
            </div>
          </div>
        )}
        
        {/* Header with Score */}
        <div className={`py-12 text-center ${score >= 80 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' : score >= 70 ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20' : 'bg-gradient-to-r from-orange-500/20 to-amber-500/20'}`}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block mb-4 relative">
              <div className="absolute inset-0 animate-ping opacity-20">
                <span className="material-icons text-8xl">
                  {score >= 80 ? "emoji_events" : score >= 70 ? "thumb_up" : "school"}
                </span>
              </div>
              <span className={`material-icons text-8xl relative ${
                score >= 80 ? 'text-green-600' : score >= 70 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {score >= 80 ? "emoji_events" : score >= 70 ? "thumb_up" : "school"}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              {score === 100 ? '🎉 Perfect Score!' : score >= 80 ? '🌟 Excellent Work!' : score >= 70 ? '👍 Well Done!' : '💪 Keep Learning!'}
            </h1>
            <p className="text-6xl font-bold mb-3" data-testid="quiz-score">
              {score}%
            </p>
            <p className="text-xl text-muted-foreground">
              You answered {correctCount} out of {questions.length} questions correctly
            </p>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Score Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-green-600 dark:text-green-400 mb-2">check_circle</span>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{correctCount}</p>
                <p className="text-sm text-green-700 dark:text-green-300">Correct Answers</p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-red-600 dark:text-red-400 mb-2">cancel</span>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">{incorrectCount}</p>
                <p className="text-sm text-red-700 dark:text-red-300">Incorrect Answers</p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-blue-600 dark:text-blue-400 mb-2">percent</span>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{Math.round((correctCount / questions.length) * 100)}%</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Accuracy Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Badges Earned */}
          {badgesEarned.length > 0 && (
            <Card className="mb-8 border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Trophy className="w-6 h-6" />
                  Badges Earned!
                </CardTitle>
                <CardDescription>
                  Congratulations! You've earned the following badges:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badgesEarned.map((badge, idx) => (
                    <Card key={idx} className="border-2 border-yellow-300">
                      <CardContent className="pt-6 text-center space-y-2">
                        <div className="text-4xl">{badge.icon}</div>
                        <p className="font-bold">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          +{badge.points} points
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/badges">
                    <Button variant="outline" className="gap-2">
                      <Trophy className="w-4 h-4" />
                      View All Badges
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Analysis */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-icons">analytics</span>
                Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Performance</span>
                  <span className="font-medium">{passingScore ? 'Pass ✅' : 'Review Needed 📚'}</span>
                </div>
                <Progress value={score} className="h-3" />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-sm text-muted-foreground">speed</span>
                  <div>
                    <p className="font-medium">Completion Rate</p>
                    <p className="text-muted-foreground">100%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-icons text-sm text-muted-foreground">grade</span>
                  <div>
                    <p className="font-medium">Grade</p>
                    <p className="text-muted-foreground">
                      {score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges Earned */}
          {badgesEarned.length > 0 && (
            <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-icons text-yellow-600">workspace_premium</span>
                  Badges Earned!
                </CardTitle>
                <CardDescription>Congratulations on your achievements!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {badgesEarned.map((badge, idx) => (
                    <Badge key={idx} className="px-4 py-2 text-base bg-yellow-600 hover:bg-yellow-700">
                      <span className="material-icons text-sm mr-2">star</span>
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Review */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-icons">quiz</span>
                Review Your Answers
              </CardTitle>
              <CardDescription>See which questions you got right and wrong</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detailedResults.map((result, idx) => (
                <Card key={idx} className={result.isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50' : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <span className={`material-icons text-2xl ${
                        result.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.isCorrect ? 'check_circle' : 'cancel'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {idx + 1}</Badge>
                          <Badge className={result.isCorrect ? 'bg-green-600' : 'bg-red-600'}>
                            {result.isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{questions[idx].question}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Your Answer: </span>
                      <span className={result.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        {result.userAnswer !== undefined ? questions[idx].options[result.userAnswer] : 'Not answered'}
                      </span>
                    </div>
                    {!result.isCorrect && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Correct Answer: </span>
                        <span className="text-green-700 dark:text-green-300">
                          {questions[idx].options[result.correctAnswer]}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => {
                setCurrentQuestion(0);
                setAnswers({});
                setShowResults(false);
                setScore(0);
                setDetailedResults([]);
                setBadgesEarned([]);
                setShowCelebration(false);
              }}
              data-testid="button-retake-quiz"
              className="flex-1"
            >
              <span className="material-icons mr-2">refresh</span>
              Retake Quiz
            </Button>
            
            {badgesEarned.length > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/badges")}
                className="flex-1"
              >
                <span className="material-icons mr-2">workspace_premium</span>
                View Badges
              </Button>
            )}
            
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setLocation("/lessons")}
              className="flex-1"
            >
              <span className="material-icons mr-2">arrow_back</span>
              Back to Lessons
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const answerLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <OfflineIndicator />
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/lessons")}
                data-testid="button-close-quiz"
              >
                <span className="material-icons">close</span>
              </Button>
              <div>
                <h2 className="font-semibold text-lg">{quiz.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="material-icons text-base">schedule</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-1.5 mt-3" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="material-icons text-base">grid_view</span>
                  Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {questions.map((_, idx) => (
                    <Button
                      key={idx}
                      variant={currentQuestion === idx ? "default" : "outline"}
                      size="sm"
                      className={`h-10 w-10 p-0 ${answers[idx] ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                      onClick={() => setCurrentQuestion(idx)}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-2 border-green-500" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-2 border-muted" />
                    <span>Unanswered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardHeader className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    Question {currentQuestion + 1}
                  </Badge>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-semibold leading-relaxed" data-testid="question-text">
                      {currentQ.question}
                    </h3>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>

                  <RadioGroup
                    value={answers[currentQuestion]?.toString() || ""}
                    onValueChange={(value) =>
                      setAnswers((prev) => ({ ...prev, [currentQuestion]: parseInt(value) }))
                    }
                  >
                    <div className="space-y-3">
                      {currentQ.options.map((option: string, idx: number) => (
                        <div
                          key={idx}
                          className={`group relative flex items-start space-x-4 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                            answers[currentQuestion] === idx
                              ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                              : "border-border hover:border-primary/50 hover:bg-accent/50 hover:scale-[1.01]"
                          }`}
                          onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion]: idx }))}
                        >
                          <div className={`flex items-center justify-center min-w-[40px] h-10 rounded-lg font-semibold transition-colors ${
                            answers[currentQuestion] === idx
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/20"
                          }`}>
                            {answerLabels[idx]}
                          </div>
                          <div className="flex-1 flex items-center">
                            <RadioGroupItem 
                              value={idx.toString()} 
                              id={`option-${idx}`} 
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`option-${idx}`}
                              className="flex-1 cursor-pointer text-base leading-relaxed"
                              data-testid={`option-${idx}`}
                            >
                              {option}
                            </Label>
                          </div>
                          {answers[currentQuestion] === idx && (
                            <span className="material-icons text-primary">check_circle</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <Separator />
                
                {/* Navigation Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    data-testid="button-previous"
                    className="flex-1"
                  >
                    <span className="material-icons mr-2">arrow_back</span>
                    Previous
                  </Button>
                  {currentQuestion === questions.length - 1 ? (
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      disabled={Object.keys(answers).length !== questions.length}
                      data-testid="button-submit-quiz"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <span className="material-icons mr-2">check</span>
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button 
                      size="lg"
                      onClick={handleNext} 
                      data-testid="button-next"
                      className="flex-1"
                    >
                      Next
                      <span className="material-icons ml-2">arrow_forward</span>
                    </Button>
                  )}
                </div>

                {/* Answer Summary Warning */}
                {currentQuestion === questions.length - 1 && Object.keys(answers).length !== questions.length && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <span className="material-icons text-amber-600">warning</span>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-amber-900 dark:text-amber-100">Incomplete Quiz</p>
                      <p className="text-amber-700 dark:text-amber-300">
                        You have {questions.length - Object.keys(answers).length} unanswered question(s). 
                        Please answer all questions before submitting.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
