import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { StudentBottomNav } from "@/components/student-bottom-nav";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";

export default function Lessons() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["/api/lessons", selectedSubject],
  });

  const subjects = [
    { id: "all", name: "All Subjects", icon: "apps" },
    { id: "math", name: "Mathematics", icon: "calculate" },
    { id: "english", name: "English", icon: "translate" },
    { id: "science", name: "Science", icon: "science" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-icons text-4xl">menu_book</span>
            <h1 className="text-2xl md:text-3xl font-bold">Lessons</h1>
          </div>
          <p className="text-primary-foreground/90">Explore curriculum-aligned content</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Subject Tabs */}
        <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            {subjects.map((subject) => (
              <TabsTrigger
                key={subject.id}
                value={subject.id}
                className="flex items-center gap-2"
                data-testid={`tab-${subject.id}`}
              >
                <span className="material-icons text-lg">{subject.icon}</span>
                <span className="hidden md:inline">{subject.name}</span>
                <span className="md:hidden">{subject.name.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Lessons Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : lessons && lessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson: any) => (
              <Card key={lesson.id} className="hover-elevate flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-primary text-3xl">
                        {lesson.subject === "math"
                          ? "calculate"
                          : lesson.subject === "english"
                            ? "translate"
                            : "science"}
                      </span>
                      <div>
                        <Badge variant="secondary" className="capitalize">
                          {lesson.subject}
                        </Badge>
                        <Badge variant="outline" className="ml-2 capitalize">
                          {lesson.level}
                        </Badge>
                      </div>
                    </div>
                    {lesson.isDownloaded && (
                      <span
                        className="material-icons text-primary"
                        title="Available offline"
                        data-testid={`offline-${lesson.id}`}
                      >
                        cloud_done
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center gap-2">
                    <Link href={`/lesson/${lesson.id}`} className="flex-1">
                      <Button className="w-full" data-testid={`button-view-${lesson.id}`}>
                        {lesson.progress > 0 ? "Continue" : "Start Lesson"}
                      </Button>
                    </Link>
                    {!lesson.isDownloaded && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Download for offline"
                        data-testid={`button-download-${lesson.id}`}
                      >
                        <span className="material-icons">download</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <span className="material-icons text-muted-foreground text-6xl mb-4">
                search_off
              </span>
              <p className="text-lg font-medium text-foreground mb-2">No lessons found</p>
              <p className="text-muted-foreground">
                Try selecting a different subject or check back later for new content
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <StudentBottomNav />
    </div>
  );
}
