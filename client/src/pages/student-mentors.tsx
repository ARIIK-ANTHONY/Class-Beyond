import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  bio?: string;
  expertise?: string[];
  experience?: string;
  education?: string;
  sessionsCompleted?: number;
  rating?: number;
  hourlyRate?: number;
  isActive?: boolean;
}

interface StudentSession {
  id: string;
  studentId: string;
  mentorId: string | null;
  subject: string;
  requestMessage: string | null;
  scheduledAt: string | null;
  status: string;
  meetingLink: string | null;
  duration: number | null;
  createdAt: string;
  mentorName?: string;
}

export default function StudentMentors() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Fetch student's sessions
  const { data: sessions } = useQuery<StudentSession[]>({
    queryKey: ["/api/student/sessions"],
  });

  // Build query key based on subject filter
  const queryKey = selectedSubject !== "all" 
    ? `/api/mentors/available?subject=${selectedSubject}` 
    : "/api/mentors/available";

  const { data: mentors, isLoading } = useQuery<Mentor[]>({
    queryKey: [queryKey],
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || "M";
  };

  const renderStars = (rating?: number) => {
    const stars = rating || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`material-icons text-sm ${
              star <= stars ? "text-yellow-500" : "text-gray-300"
            }`}
          >
            star
          </span>
        ))}
        {rating && rating > 0 && (
          <span className="text-sm text-muted-foreground ml-1">({rating.toFixed(1)})</span>
        )}
      </div>
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
                <h1 className="text-2xl font-bold text-foreground">Our Mentors</h1>
                <p className="text-sm text-muted-foreground">Connect with experienced mentors who can guide your learning</p>
              </div>
            </div>
            <NotificationBell />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
        {/* My Sessions Section */}
        {sessions && sessions.filter(s => s.status === "scheduled" && s.scheduledAt).length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">My Scheduled Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions
                .filter(s => s.status === "scheduled" && s.scheduledAt)
                .map((session) => (
                  <Card key={session.id} className="hover-elevate border-l-4 border-l-primary">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[60px]">
                          <span className="text-xs font-medium text-muted-foreground">
                            {new Date(session.scheduledAt!).toLocaleTimeString('en-US', { 
                              hour: 'numeric',
                              hour12: true 
                            }).split(' ')[1]}
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            {new Date(session.scheduledAt!).toLocaleTimeString('en-US', { 
                              hour: 'numeric',
                              hour12: false 
                            }).split(':')[0]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.scheduledAt!).toLocaleTimeString('en-US', { 
                              minute: '2-digit'
                            }).split(':')[1]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="capitalize">
                              {session.subject}
                            </Badge>
                            <Badge variant="outline">
                              {new Date(session.scheduledAt!).toLocaleDateString()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.requestMessage || "Mentorship session"}
                          </p>
                        </div>
                        {session.meetingLink && (
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log('Student joining meeting:', session.meetingLink);
                              window.open(session.meetingLink!, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <span className="material-icons mr-1 text-lg">video_call</span>
                            Join Meet
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Filter Tabs */}
        <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="mb-4 md:mb-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 h-auto p-1 bg-muted/50">
            <TabsTrigger value="all" className="text-xs md:text-sm py-2 data-[state=active]:shadow-md">All Subjects</TabsTrigger>
            <TabsTrigger value="math" className="text-xs md:text-sm py-2 data-[state=active]:shadow-md">Math</TabsTrigger>
            <TabsTrigger value="english" className="text-xs md:text-sm py-2 data-[state=active]:shadow-md">English</TabsTrigger>
            <TabsTrigger value="science" className="text-xs md:text-sm py-2 data-[state=active]:shadow-md">Science</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Mentors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 md:h-80" />
            ))}
          </div>
        ) : mentors && mentors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14 md:h-16 md:w-16 ring-2 ring-primary/20">
                      <AvatarImage src={mentor.profileImageUrl} alt={mentor.firstName} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-lg md:text-xl">
                        {getInitials(mentor.firstName, mentor.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-lg truncate">
                        {mentor.firstName} {mentor.lastName}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm mt-1">
                        {mentor.sessionsCompleted || 0} sessions
                      </CardDescription>
                      <div className="mt-2">{renderStars(mentor.rating)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {mentor.bio && (
                    <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-3">
                      {mentor.bio}
                    </p>
                  )}

                  {mentor.expertise && mentor.expertise.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Expertise:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.expertise.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs capitalize">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {mentor.experience && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Experience:
                      </p>
                      <p className="text-sm line-clamp-2">{mentor.experience}</p>
                    </div>
                  )}

                  {mentor.education && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Education:
                      </p>
                      <p className="text-sm line-clamp-2">{mentor.education}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    {mentor.isActive !== false ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Available</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      </div>
                    )}
                    <Link href="/mentorship/request">
                      <Button size="sm" disabled={mentor.isActive === false}>
                        <span className="material-icons text-sm mr-1">person_add</span>
                        Request Session
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="material-icons text-muted-foreground text-6xl mb-4">
                people_outline
              </span>
              <h3 className="text-xl font-semibold mb-2">No Mentors Available</h3>
              <p className="text-muted-foreground mb-4">
                {selectedSubject !== "all"
                  ? `No mentors are currently available for ${selectedSubject}.`
                  : "No mentors are currently available."}
              </p>
              <p className="text-sm text-muted-foreground">
                Please check back later or try a different subject.
              </p>
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
