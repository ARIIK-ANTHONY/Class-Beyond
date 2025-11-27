import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { useLocation } from "wouter";

interface MentorProfile {
  id: string;
  mentorId: string;
  bio: string | null;
  expertise: string[] | null;
  experience: string | null;
  education: string | null;
  availability: any[] | null;
  hourlyRate: number | null;
  totalSessions: number;
  averageRating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MentorReview {
  id: string;
  mentorId: string;
  studentId: string;
  sessionId: string | null;
  rating: number;
  review: string | null;
  createdAt: string;
}

const profileSchema = z.object({
  bio: z.string().min(50, "Bio must be at least 50 characters").max(500),
  experience: z.string().min(20, "Please provide at least 20 characters about your experience"),
  education: z.string().min(10, "Please provide your educational background"),
  hourlyRate: z.number().min(0).optional(),
  isActive: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function MentorProfileSetup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);

  const { data: profile, isLoading } = useQuery<MentorProfile>({
    queryKey: ["/api/mentor/profile"],
  });

  const { data: reviews } = useQuery<MentorReview[]>({
    queryKey: ["/api/mentor/reviews"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: "",
      experience: "",
      education: "",
      hourlyRate: 0,
      isActive: true,
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        bio: profile.bio || "",
        experience: profile.experience || "",
        education: profile.education || "",
        hourlyRate: profile.hourlyRate || 0,
        isActive: profile.isActive ?? true,
      });
      if (profile.expertise && Array.isArray(profile.expertise)) {
        setExpertise(profile.expertise);
      }
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      await apiRequest("PATCH", "/api/mentor/profile", {
        ...data,
        expertise,
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated!",
        description: "Your mentor profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/profile"] });
      // Navigate back to dashboard after successful save
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addExpertise = () => {
    if (expertiseInput.trim() && !expertise.includes(expertiseInput.trim())) {
      setExpertise([...expertise, expertiseInput.trim()]);
      setExpertiseInput("");
    }
  };

  const removeExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item));
  };

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const averageRating = profile?.averageRating ? (profile.averageRating / 100).toFixed(1) : "0.0";

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="mentor" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <OfflineIndicator />
          
          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Mentor Profile Setup</h1>
                <p className="text-sm text-muted-foreground">Complete your profile to help students find and connect with you</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{profile?.totalSessions || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Average Rating</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-primary">{averageRating}</p>
                      <span className="material-icons text-yellow-500">star</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{reviews?.length || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    This information will be visible to students when they're looking for mentors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell students about yourself, your teaching style, and what you're passionate about..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0}/500 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <FormLabel>Areas of Expertise</FormLabel>
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="e.g., Algebra, Calculus, Essay Writing"
                            value={expertiseInput}
                            onChange={(e) => setExpertiseInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addExpertise();
                              }
                            }}
                          />
                          <Button type="button" onClick={addExpertise} variant="secondary">
                            Add
                          </Button>
                        </div>
                        {expertise.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {expertise.map((item, index) => (
                              <Badge key={index} variant="secondary" className="gap-1">
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeExpertise(item)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Add specific subjects or topics you specialize in
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your teaching experience, years of practice, notable achievements..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="education"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Education</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Your educational background, degrees, certifications..."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Leave as 0 if you're offering free mentorship
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active Status</FormLabel>
                              <FormDescription>
                                When inactive, you won't appear in mentor searches
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="w-full"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Reviews Section */}
              {reviews && reviews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Student Reviews</CardTitle>
                    <CardDescription>See what students are saying about you</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reviews && reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`material-icons text-sm ${
                                  i < review.rating ? "text-yellow-500" : "text-gray-300"
                                }`}
                              >
                                star
                              </span>
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {review.review && (
                            <p className="text-sm text-foreground">{review.review}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
