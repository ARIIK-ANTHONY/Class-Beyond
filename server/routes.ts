import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuizSubmissionSchema, insertMentorshipSessionSchema, insertStudentProgressSchema, insertLessonSchema, insertQuizSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

// Middleware to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Middleware to require specific role
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = req.user as any;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============= Authentication Routes =============
  app.get("/api/user", requireAuth, (req, res) => {
    res.json(req.user);
  });

  // ============= Student Routes =============
  // Get all lessons (filtered by grade/subject)
  app.get("/api/lessons", requireAuth, async (req, res) => {
    try {
      const { gradeLevel, subject } = req.query;
      const filters: any = {};
      if (gradeLevel) filters.gradeLevel = parseInt(gradeLevel as string);
      if (subject) filters.subject = subject as string;
      
      const lessons = await storage.getAllLessons(filters);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Get specific lesson
  app.get("/api/lessons/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const lesson = await storage.getLesson(id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // Get quizzes for a lesson
  app.get("/api/lessons/:id/quizzes", requireAuth, async (req, res) => {
    try {
      const lessonId = req.params.id;
      const quizzes = await storage.getQuizzesByLesson(lessonId);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  // Submit quiz
  app.post("/api/quizzes/:id/submit", requireRole("student"), async (req, res) => {
    try {
      const quizId = req.params.id;
      const user = req.user as any;
      
      const validationResult = insertQuizSubmissionSchema.safeParse({
        ...req.body,
        quizId,
        studentId: user.id,
      });

      if (!validationResult.success) {
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }

      const submission = await storage.createQuizSubmission(validationResult.data);
      
      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "quiz_submit",
        details: { quizId, score: submission.score },
      });

      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Get student's progress
  app.get("/api/student/progress", requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const progress = await storage.getProgressByUser(user.id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Update lesson progress
  app.post("/api/student/progress", requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      
      const validationResult = insertStudentProgressSchema.safeParse({
        ...req.body,
        studentId: user.id,
      });

      if (!validationResult.success) {
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }

      const progress = await storage.createOrUpdateProgress(validationResult.data);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // Get student's badges
  app.get("/api/student/badges", requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const badges = await storage.getBadgesByUser(user.id);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Get student's quiz submissions
  app.get("/api/student/submissions", requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const submissions = await storage.getQuizSubmissionsByStudent(user.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Request mentorship
  app.post("/api/student/request-mentorship", requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      
      const validationResult = insertMentorshipSessionSchema.safeParse({
        ...req.body,
        studentId: user.id,
        mentorId: null, // Will be assigned when mentor accepts
        scheduledAt: null,
        status: "requested",
      });

      if (!validationResult.success) {
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }

      const session = await storage.createMentorshipSession(validationResult.data);
      
      // Create notification for mentors
      const mentors = await storage.getUsersByRole("mentor");
      for (const mentor of mentors) {
        await storage.createNotification({
          userId: mentor.id,
          type: "mentorship_request",
          message: `New mentorship request for ${req.body.subject}`,
          relatedId: session.id.toString(),
        });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create mentorship request" });
    }
  });

  // Get student's mentorship sessions
  app.get("/api/student/mentorship-sessions", requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const sessions = await storage.getMentorshipSessionsByStudent(user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship sessions" });
    }
  });

  // ============= Teacher Routes =============
  // Create lesson
  app.post("/api/teacher/lessons", requireRole("teacher", "admin"), async (req, res) => {
    try {
      const validationResult = insertLessonSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }

      const lesson = await storage.createLesson(validationResult.data);
      
      // Create audit log
      const user = req.user as any;
      await storage.createAuditLog({
        userId: user.id,
        action: "lesson_create",
        details: { lessonId: lesson.id, title: lesson.title },
      });

      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // Update lesson
  app.patch("/api/teacher/lessons/:id", requireRole("teacher", "admin"), async (req, res) => {
    try {
      const id = req.params.id;
      
      const validationResult = insertLessonSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }
      
      const lesson = await storage.updateLesson(id, validationResult.data);
      
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  // Create quiz
  app.post("/api/teacher/quizzes", requireRole("teacher", "admin"), async (req, res) => {
    try {
      const validationResult = insertQuizSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }

      const quiz = await storage.createQuiz(validationResult.data);
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ error: "Failed to create quiz" });
    }
  });

  // ============= Mentor Routes =============
  // Get mentor's stats
  app.get("/api/mentor/stats", requireRole("mentor"), async (req, res) => {
    try {
      const user = req.user as any;
      const sessions = await storage.getMentorshipSessionsByMentor(user.id);
      
      const stats = {
        totalSessions: sessions.length,
        pendingRequests: sessions.filter(s => s.status === "pending").length,
        sessionsThisWeek: sessions.filter(s => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return s.createdAt && new Date(s.createdAt) > weekAgo;
        }).length,
        studentsHelped: new Set(sessions.map(s => s.studentId)).size,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get pending requests
  app.get("/api/mentor/pending-requests", requireRole("mentor"), async (req, res) => {
    try {
      const requests = await storage.getPendingMentorshipRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  // Get upcoming sessions
  app.get("/api/mentor/upcoming-sessions", requireRole("mentor"), async (req, res) => {
    try {
      const user = req.user as any;
      const sessions = await storage.getMentorshipSessionsByMentor(user.id);
      const upcoming = sessions.filter(s => s.status === "scheduled" && s.scheduledAt && new Date(s.scheduledAt) > new Date());
      res.json(upcoming);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming sessions" });
    }
  });

  // Update mentorship session
  app.patch("/api/mentor/sessions/:id", requireRole("mentor"), async (req, res) => {
    try {
      const id = req.params.id;
      const user = req.user as any;
      
      const validationResult = insertMentorshipSessionSchema.partial().safeParse({
        ...req.body,
        mentorId: user.id, // Assign mentor when accepting
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }
      
      const session = await storage.updateMentorshipSession(id, validationResult.data);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Notify student
      if (req.body.status === "approved") {
        await storage.createNotification({
          userId: session.studentId,
          type: "mentorship_approved",
          message: "Your mentorship request has been approved!",
          relatedId: session.id,
        });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // Get available mentors for a subject
  app.get("/api/mentors/available", requireAuth, async (req, res) => {
    try {
      const mentors = await storage.getUsersByRole("mentor");
      res.json(mentors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  // ============= Parent Routes =============
  // Get children (mock - would need parent-child relationship table)
  app.get("/api/parent/children", requireRole("parent"), async (req, res) => {
    try {
      // Mock implementation - would need proper parent-child relationship
      const students = await storage.getUsersByRole("student");
      res.json(students.slice(0, 3)); // Return first 3 as mock children
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch children" });
    }
  });

  // Get child's stats
  app.get("/api/parent/child-stats/:childId", requireRole("parent"), async (req, res) => {
    try {
      const childId = req.params.childId;
      const progress = await storage.getProgressByUser(childId);
      const submissions = await storage.getQuizSubmissionsByStudent(childId);
      const badges = await storage.getBadgesByUser(childId);
      
      const completedLessons = progress.filter(p => p.isCompleted).length;
      const totalLessons = await storage.getAllLessons({});
      const avgScore = submissions.length > 0
        ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
        : 0;
      
      const stats = {
        completedLessons,
        totalLessons: totalLessons.length,
        badges: badges.length,
        averageScore: avgScore,
        streak: 0, // Would need streak calculation logic
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch child stats" });
    }
  });

  // Get child's recent activity
  app.get("/api/parent/child-activity/:childId", requireRole("parent"), async (req, res) => {
    try {
      const childId = req.params.childId;
      const submissions = await storage.getQuizSubmissionsByStudent(childId);
      const progress = await storage.getProgressByUser(childId);
      
      // Combine and format recent activity
      const activity = [
        ...submissions.slice(0, 5).map(s => ({
          id: s.id,
          type: "quiz",
          title: `Quiz ${s.quizId}`,
          description: "Completed quiz",
          score: s.score,
          timestamp: s.submittedAt,
        })),
        ...progress.slice(0, 5).map(p => ({
          id: p.id,
          type: "lesson",
          title: `Lesson ${p.lessonId}`,
          description: p.isCompleted ? "Completed lesson" : "In progress",
          timestamp: p.lastAccessedAt,
        })),
      ];
      
      res.json(activity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch child activity" });
    }
  });

  // Get child's upcoming sessions
  app.get("/api/parent/child-sessions/:childId", requireRole("parent"), async (req, res) => {
    try {
      const childId = req.params.childId;
      const sessions = await storage.getMentorshipSessionsByStudent(childId);
      const upcoming = sessions.filter(s => s.status === "scheduled" && s.scheduledAt && new Date(s.scheduledAt) > new Date());
      res.json(upcoming);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // ============= NGO Partner Routes =============
  app.get("/api/ngo/stats", requireRole("ngo_partner", "admin"), async (req, res) => {
    try {
      const students = await storage.getUsersByRole("student");
      const lessons = await storage.getAllLessons({});
      const submissions = await storage.getQuizSubmissionsByStudent(students[0]?.id || "");
      
      const avgPerformance = submissions.length > 0
        ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
        : 0;
      
      const stats = {
        totalStudents: students.length,
        activeStudents: Math.floor(students.length * 0.7), // Mock active percentage
        lessonsCompleted: submissions.length,
        avgPerformance,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NGO stats" });
    }
  });

  // ============= Notifications =============
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const notifications = await storage.getNotificationsByUser(user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
