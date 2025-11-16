import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentBottomNav } from "@/components/student-bottom-nav";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMentorshipSessionSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertMentorshipSessionSchema.extend({
  requestMessage: z.string().min(10, "Please provide at least 10 characters describing what you need help with"),
}).pick({ subject: true, requestMessage: true });

type FormData = z.infer<typeof formSchema>;

export default function MentorshipRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: undefined,
      requestMessage: "",
    },
  });

  const subject = form.watch("subject");

  const { data: availableMentors } = useQuery({
    queryKey: ["/api/mentors/available", subject],
    enabled: !!subject,
  });

  const requestMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/student/request-mentorship", data);
    },
    onSuccess: () => {
      toast({
        title: "Request Sent!",
        description: "A mentor will review your request and get back to you soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/mentorship-sessions"] });
      setLocation("/");
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
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send mentorship request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    requestMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-icons text-4xl">people</span>
            <h1 className="text-2xl md:text-3xl font-bold">Request Mentorship</h1>
          </div>
          <p className="text-primary-foreground/90">Get help from an experienced mentor</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Request a Mentorship Session</CardTitle>
            <CardDescription>
              Choose a subject you need help with and describe what you'd like to learn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Subject Selection */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-subject">
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="math" data-testid="subject-math">
                            Mathematics
                          </SelectItem>
                          <SelectItem value="english" data-testid="subject-english">
                            English
                          </SelectItem>
                          <SelectItem value="science" data-testid="subject-science">
                            Science
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Available Mentors */}
                {subject && availableMentors && availableMentors.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg" data-testid="available-mentors">
                    <p className="text-sm font-medium mb-2">Available Mentors</p>
                    <div className="flex flex-wrap gap-2">
                      {availableMentors.slice(0, 3).map((mentor: any) => (
                        <div
                          key={mentor.id}
                          className="flex items-center gap-2 px-3 py-1 bg-background rounded-full text-sm"
                          data-testid={`mentor-${mentor.id}`}
                        >
                          <span className="material-icons text-primary text-sm">person</span>
                          {mentor.firstName} {mentor.lastName}
                        </div>
                      ))}
                      {availableMentors.length > 3 && (
                        <div className="px-3 py-1 text-sm text-muted-foreground">
                          +{availableMentors.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Request Message */}
                <FormField
                  control={form.control}
                  name="requestMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What would you like help with? *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the topics or concepts you need help understanding..."
                          rows={5}
                          data-testid="input-message"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about what you're struggling with so the mentor can prepare
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={requestMutation.isPending}
                    data-testid="button-submit-request"
                  >
                    {requestMutation.isPending ? (
                      <>
                        <span className="material-icons mr-2 animate-spin">refresh</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="material-icons mr-2">send</span>
                        Send Request
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How Mentorship Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Submit Your Request</p>
                <p className="text-sm text-muted-foreground">
                  Choose a subject and describe what you need help with
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Mentor Reviews</p>
                <p className="text-sm text-muted-foreground">
                  An available mentor will review your request and accept it
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Get Scheduled</p>
                <p className="text-sm text-muted-foreground">
                  You'll receive a notification when your session is scheduled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StudentBottomNav />
    </div>
  );
}
