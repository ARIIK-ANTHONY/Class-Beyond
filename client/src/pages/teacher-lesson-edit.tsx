import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { auth } from "@/lib/firebase";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherLessonEdit() {
  const [, params] = useRoute("/teacher/lessons/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const lessonId = params?.id;

  // Lesson form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<"math" | "english" | "science">("math");
  const [level, setLevel] = useState("beginner");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Fetch lesson data
  const { data: lesson, isLoading } = useQuery({
    queryKey: [`/api/lessons/${lessonId}`],
    enabled: !!lessonId,
  });

  // Populate form when lesson loads
  useEffect(() => {
    if (lesson) {
      const lessonData = lesson as any;
      setTitle(lessonData.title || "");
      setSubject(lessonData.subject || "math");
      setLevel(lessonData.level || "beginner");
      setDescription(lessonData.description || "");
      setContent(lessonData.content || "");
    }
  }, [lesson]);

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/teacher/lessons/${lessonId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update lesson");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Lesson updated successfully.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

    updateLessonMutation.mutate({
      title,
      subject,
      level,
      description,
      content,
    });
  };

  if (isLoading) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar role="teacher" />
          <div className="flex flex-col flex-1 overflow-hidden">
            <OfflineIndicator />
            <main className="flex-1 overflow-auto p-6 bg-background">
              <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-96" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

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
                <h1 className="text-2xl font-bold text-foreground">Edit Lesson</h1>
                <p className="text-sm text-muted-foreground">Update your lesson content</p>
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
                  <CardDescription>Update the essential details about your lesson</CardDescription>
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
                  <CardDescription>Update the main content of your lesson</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your lesson content here..."
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

              {/* Submit */}
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Updated lesson will require admin approval again before being published.
                      </p>
                    </div>
                    <Button type="submit" size="lg" disabled={updateLessonMutation.isPending}>
                      {updateLessonMutation.isPending ? (
                        <>
                          <span className="material-icons mr-2 animate-spin">refresh</span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <span className="material-icons mr-2">save</span>
                          Save Changes
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
