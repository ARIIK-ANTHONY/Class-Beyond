import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { NotificationBell } from "@/components/notification-bell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface Session {
  id: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  requestMessage: string | null;
  meetLink: string | null;
}

export default function MentorSessions() {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/mentor/sessions"],
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/mentor/sessions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/stats"] });
      toast({
        title: "Session updated",
        description: "The session status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update session status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scheduleSessionMutation = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      return await apiRequest("POST", `/api/mentor/sessions/${id}/schedule`, { scheduledAt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/upcoming-sessions"] });
      setScheduleDialogOpen(false);
      setSelectedSession(null);
      setScheduleDate("");
      setScheduleTime("");
      toast({
        title: "Session scheduled",
        description: "The session has been scheduled with an automatically generated Google Meet link. The student will be notified.",
      });
    },
    onError: () => {
      toast({
        title: "Scheduling failed",
        description: "Failed to schedule the session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleSession = () => {
    if (!selectedSession || !scheduleDate || !scheduleTime) {
      toast({
        title: "Missing information",
        description: "Please provide both date and time for the session.",
        variant: "destructive",
      });
      return;
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    scheduleSessionMutation.mutate({
      id: selectedSession.id,
      scheduledAt,
    });
  };

  const openScheduleDialog = (session: Session) => {
    setSelectedSession(session);
    setScheduleDialogOpen(true);
  };

  const pendingSessions = sessions?.filter(s => s.status === "pending" || s.status === "requested") || [];
  const scheduledSessions = sessions?.filter(s => s.status === "scheduled" && s.scheduledAt) || [];
  const completedSessions = sessions?.filter(s => s.status === "completed") || [];
  const cancelledSessions = sessions?.filter(s => s.status === "cancelled" || s.status === "rejected") || [];

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full" style={style as any}>
        <AppSidebar role="mentor" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">My Sessions</h1>
            </div>
            <NotificationBell />
            <OfflineIndicator />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending">
                    Pending {pendingSessions.length > 0 && `(${pendingSessions.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="scheduled">
                    Scheduled {scheduledSessions.length > 0 && `(${scheduledSessions.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed {completedSessions.length > 0 && `(${completedSessions.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Cancelled {cancelledSessions.length > 0 && `(${cancelledSessions.length})`}
                  </TabsTrigger>
                </TabsList>

                {/* Pending Sessions */}
                <TabsContent value="pending" className="mt-6">
                  {isLoading ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Loading sessions...</p>
                      </CardContent>
                    </Card>
                  ) : pendingSessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <span className="material-icons text-muted-foreground text-5xl mb-4">inbox</span>
                        <p className="text-muted-foreground">No pending session requests</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {pendingSessions.map((session) => (
                        <Card key={session.id} className="hover-elevate">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{session.studentName}</h3>
                                  <Badge variant="secondary" className="capitalize">{session.subject}</Badge>
                                  <Badge variant="outline">New Request</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{session.studentEmail}</p>
                                {session.requestMessage && (
                                  <p className="text-sm text-foreground mt-2 p-3 bg-muted rounded-md">
                                    "{session.requestMessage}"
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  Requested on {new Date(session.createdAt).toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openScheduleDialog(session)}
                                  disabled={updateSessionMutation.isPending}
                                >
                                  <span className="material-icons mr-1 text-lg">event</span>
                                  Schedule
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateSessionMutation.mutate({ id: session.id, status: "rejected" })}
                                  disabled={updateSessionMutation.isPending}
                                >
                                  <span className="material-icons mr-1 text-lg">close</span>
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Scheduled Sessions */}
                <TabsContent value="scheduled" className="mt-6">
                  {scheduledSessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <span className="material-icons text-muted-foreground text-5xl mb-4">event_available</span>
                        <p className="text-muted-foreground">No scheduled sessions</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {scheduledSessions.map((session) => (
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
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{session.studentName}</h3>
                                  <Badge variant="secondary" className="capitalize">
                                    <span className="material-icons text-xs mr-1">subject</span>
                                    {session.subject}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(session.scheduledAt!).toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric'
                                  })}
                                </p>
                                {session.requestMessage && (
                                  <p className="text-sm text-muted-foreground mt-2 italic">
                                    {session.requestMessage}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {session.meetLink ? (
                                  <Button
                                    size="sm"
                                    onClick={() => window.open(session.meetLink!, '_blank')}
                                  >
                                    <span className="material-icons mr-1 text-lg">video_call</span>
                                    Join Meet
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline">
                                    <span className="material-icons mr-1 text-lg">info</span>
                                    Details
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateSessionMutation.mutate({ id: session.id, status: "completed" })}
                                  disabled={updateSessionMutation.isPending}
                                >
                                  <span className="material-icons mr-1 text-lg">check_circle</span>
                                  Mark Complete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Completed Sessions */}
                <TabsContent value="completed" className="mt-6">
                  {completedSessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <span className="material-icons text-muted-foreground text-5xl mb-4">task_alt</span>
                        <p className="text-muted-foreground">No completed sessions yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {completedSessions.map((session) => (
                        <Card key={session.id}>
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{session.studentName}</h3>
                                  <Badge variant="secondary" className="capitalize">{session.subject}</Badge>
                                  <Badge className="bg-green-500">
                                    <span className="material-icons text-xs mr-1">check_circle</span>
                                    Completed
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Completed on {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric'
                                  }) : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Cancelled Sessions */}
                <TabsContent value="cancelled" className="mt-6">
                  {cancelledSessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <span className="material-icons text-muted-foreground text-5xl mb-4">cancel</span>
                        <p className="text-muted-foreground">No cancelled sessions</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {cancelledSessions.map((session) => (
                        <Card key={session.id} className="opacity-75">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{session.studentName}</h3>
                                  <Badge variant="secondary" className="capitalize">{session.subject}</Badge>
                                  <Badge variant="destructive">
                                    {session.status === "rejected" ? "Declined" : "Cancelled"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(session.createdAt).toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
            <DialogDescription>
              Set a date and time for the session with {selectedSession?.studentName}. A Google Meet link will be automatically generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <span className="material-icons text-primary mt-0.5">info</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Automatic Meeting Link</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A Google Meet link will be automatically created when you schedule this session. Both you and the student will receive the link via email.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleSession}
              disabled={scheduleSessionMutation.isPending || !scheduleDate || !scheduleTime}
            >
              {scheduleSessionMutation.isPending ? "Scheduling..." : "Schedule Session"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
