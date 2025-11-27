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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = insertMentorshipSessionSchema.extend({
  requestMessage: z.string().min(10, "Please provide at least 10 characters describing what you need help with"),
  mentorId: z.string().optional(),
}).pick({ subject: true, requestMessage: true, mentorId: true });

type FormData = z.infer<typeof formSchema>;

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  bio?: string;
  expertise?: string[];
  sessionsCompleted?: number;
  rating?: number;
}

export default function MentorshipRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: undefined,
      requestMessage: "",
      mentorId: "",
    },
  });

  const subject = form.watch("subject");

  // Build query key based on subject filter
  const mentorsQueryKey = subject 
    ? `/api/mentors/available?subject=${subject}`
    : `/api/mentors/available`;

  const { data: availableMentors, isLoading: mentorsLoading } = useQuery<Mentor[]>({
    queryKey: [mentorsQueryKey],
  });

  const requestMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/student/request-mentorship", {
        ...data,
        mentorId: selectedMentorId || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Sent!",
        description: "Your selected mentor will review your request and get back to you soon.",
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
    if (!selectedMentorId) {
      toast({
        title: "Select a Mentor",
        description: "Please select a mentor to send your request to.",
        variant: "destructive",
      });
      return;
    }
    requestMutation.mutate(data);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "M";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-icons text-4xl">people</span>
            <h1 className="text-2xl md:text-3xl font-bold">Request Mentorship</h1>
          </div>
          <p className="text-primary-foreground/90">Choose a mentor and get personalized help</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request a Mentorship Session</CardTitle>
                <CardDescription>
                  Follow these steps to connect with your mentor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Step 1: Choose Subject */}
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold shrink-0">
                        1
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">Choose Your Subject</h3>
                          <p className="text-sm text-muted-foreground">
                            Select the subject you need help with
                          </p>
                        </div>
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
                                <div className="flex items-center gap-2">
                                  <span className="material-icons text-sm">calculate</span>
                                  Mathematics
                                </div>
                              </SelectItem>
                              <SelectItem value="english" data-testid="subject-english">
                                <div className="flex items-center gap-2">
                                  <span className="material-icons text-sm">translate</span>
                                  English
                                </div>
                              </SelectItem>
                              <SelectItem value="science" data-testid="subject-science">
                                <div className="flex items-center gap-2">
                                  <span className="material-icons text-sm">science</span>
                                  Science
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      </div>
                    </div>

                    {/* Step 2: Choose Mentor */}
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold shrink-0">
                        2
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">Choose Your Mentor</h3>
                          <p className="text-sm text-muted-foreground">
                            Select a mentor from the list on the right →
                          </p>
                        </div>
                        {!subject && (
                          <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <span className="material-icons text-blue-600 dark:text-blue-400 text-sm mt-0.5">info</span>
                              <p className="text-xs text-blue-800 dark:text-blue-200">
                                Select a subject in Step 1 to see specialized mentors, or browse all available mentors on the right
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedMentorId && availableMentors ? (
                          <div className="border border-primary/50 rounded-lg p-3 bg-primary/5">
                            {(() => {
                              const mentor = availableMentors.find(m => m.id === selectedMentorId);
                              return mentor ? (
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={mentor.profileImageUrl} />
                                    <AvatarFallback>
                                      {getInitials(mentor.firstName, mentor.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {mentor.firstName} {mentor.lastName}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <span className="material-icons text-xs text-yellow-500">star</span>
                                      {mentor.rating || 5.0} • {mentor.sessionsCompleted || 0} sessions
                                    </div>
                                  </div>
                                  <Badge variant="secondary">Selected</Badge>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                            <span className="material-icons text-muted-foreground text-3xl mb-2">person_search</span>
                            <p className="text-sm text-muted-foreground">
                              No mentor selected yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Describe Your Need */}
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold shrink-0">
                        3
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">Describe What You Need</h3>
                          <p className="text-sm text-muted-foreground">
                            Help your mentor prepare by being specific
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="requestMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What would you like help with? *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Example: I'm struggling with quadratic equations, especially when it comes to factoring and using the quadratic formula. I'd like to understand when to use each method..."
                                  rows={6}
                                  data-testid="input-message"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Be specific about topics, concepts, or problems you need help with
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Step 4: Submit Request */}
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold shrink-0">
                        4
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">Submit Your Request</h3>
                          <p className="text-sm text-muted-foreground">
                            Your mentor will review and schedule a session
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={requestMutation.isPending || !selectedMentorId}
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
                                Send Request to Mentor
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
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Mentor Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Available Mentors</CardTitle>
                <CardDescription>
                  {subject
                    ? `Mentors specializing in ${subject}`
                    : "All available mentors - select a subject to filter"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mentorsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : !availableMentors || availableMentors.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-icons text-muted-foreground text-5xl mb-3">
                      person_off
                    </span>
                    <p className="text-sm text-muted-foreground mb-4">
                      {subject 
                        ? `No mentors available for ${subject} right now`
                        : "No mentors available right now"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mentors need to complete their profile setup to appear here
                    </p>
                  </div>
                ) : (
                  <RadioGroup value={selectedMentorId} onValueChange={setSelectedMentorId}>
                    <div className="space-y-3">
                      {availableMentors.map((mentor) => (
                        <div
                          key={mentor.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            selectedMentorId === mentor.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedMentorId(mentor.id)}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={mentor.id} id={mentor.id} className="mt-1" />
                            <Label
                              htmlFor={mentor.id}
                              className="flex-1 cursor-pointer space-y-2"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={mentor.profileImageUrl} />
                                  <AvatarFallback>
                                    {getInitials(mentor.firstName, mentor.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {mentor.firstName} {mentor.lastName}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className="material-icons text-xs text-yellow-500">
                                      star
                                    </span>
                                    {mentor.rating || 5.0} • {mentor.sessionsCompleted || 0} sessions
                                  </div>
                                </div>
                              </div>
                              {mentor.bio && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {mentor.bio}
                                </p>
                              )}
                              {mentor.expertise && mentor.expertise.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {mentor.expertise.slice(0, 3).map((skill, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs py-0 px-1.5"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {selectedMentorId && availableMentors && (
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-2">
                      <span className="material-icons text-primary text-sm mt-0.5">info</span>
                      <p className="text-xs text-foreground">
                        Your request will be sent directly to{" "}
                        <span className="font-medium">
                          {
                            availableMentors.find((m) => m.id === selectedMentorId)
                              ?.firstName
                          }
                        </span>
                        . They'll review it and schedule a session with you.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <StudentBottomNav />
    </div>
  );
}
