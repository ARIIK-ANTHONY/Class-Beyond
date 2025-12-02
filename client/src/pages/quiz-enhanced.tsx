// This is the results screen section - copy this to replace the old results screen in quiz.tsx

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

          {/* Question Review - Simplified */}
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
                        {result.userAnswer || 'Not answered'}
                      </span>
                    </div>
                    {!result.isCorrect && (
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Correct Answer: </span>
                        <span className="text-green-700 dark:text-green-300">
                          {result.correctAnswer}
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
