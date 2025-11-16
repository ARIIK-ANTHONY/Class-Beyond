import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Quiz() {
  const [, params] = useRoute("/quiz/:id");
  const [, setLocation] = useLocation();
  const quizId = params?.id;
  const { toast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["/api/quizzes", quizId],
    enabled: !!quizId,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (submission: { quizId: string; answers: any[]; score: number; totalQuestions: number }) => {
      await apiRequest("POST", "/api/student/submit-quiz", submission);
    },
    onSuccess: () => {
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
    setShowResults(true);

    submitQuizMutation.mutate({
      quizId: quizId!,
      answers: answersArray,
      score: calculatedScore,
      totalQuestions: questions.length,
    });
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <OfflineIndicator />
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mb-4">
              <span className="material-icons text-6xl text-primary">
                {score >= 80 ? "emoji_events" : score >= 60 ? "thumb_up" : "sentiment_satisfied"}
              </span>
            </div>
            <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary mb-2" data-testid="quiz-score">
                {score}%
              </p>
              <p className="text-muted-foreground">
                You got {questions.filter((q, idx) => answers[idx] === q.correctAnswer).length} out of{" "}
                {questions.length} correct
              </p>
            </div>

            {score === 100 && (
              <div className="bg-primary/10 border border-primary rounded-lg p-4 text-center">
                <span className="material-icons text-primary text-3xl mb-2">workspace_premium</span>
                <p className="font-medium text-primary">Perfect Score! Badge Earned!</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers({});
                  setShowResults(false);
                  setScore(0);
                }}
                data-testid="button-retake-quiz"
              >
                <span className="material-icons mr-2">refresh</span>
                Retake Quiz
              </Button>
              <Button variant="outline" onClick={() => setLocation("/lessons")}>
                Back to Lessons
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OfflineIndicator />
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>{quiz.title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/lessons")}
              data-testid="button-close-quiz"
            >
              <span className="material-icons">close</span>
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4" data-testid="question-text">
              {currentQ.question}
            </h3>

            <RadioGroup
              value={answers[currentQuestion] || ""}
              onValueChange={(value) =>
                setAnswers((prev) => ({ ...prev, [currentQuestion]: value }))
              }
            >
              <div className="space-y-3">
                {currentQ.options.map((option: string, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors hover-elevate ${
                      answers[currentQuestion] === option
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label
                      htmlFor={`option-${idx}`}
                      className="flex-1 cursor-pointer"
                      data-testid={`option-${idx}`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              data-testid="button-previous"
            >
              <span className="material-icons mr-2">arrow_back</span>
              Previous
            </Button>
            <div className="flex-1" />
            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
                data-testid="button-submit-quiz"
              >
                Submit Quiz
                <span className="material-icons ml-2">check</span>
              </Button>
            ) : (
              <Button onClick={handleNext} data-testid="button-next">
                Next
                <span className="material-icons ml-2">arrow_forward</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
