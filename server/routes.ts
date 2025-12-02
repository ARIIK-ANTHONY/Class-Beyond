import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuizSubmissionSchema, insertMentorshipSessionSchema, insertStudentProgressSchema, insertLessonSchema, insertQuizSchema, type User, users, studentProgress, lessons as lessonsTable, quizzes, quizSubmissions, studentBadges, forumQuestions, forumAnswers } from "@shared/schema";
import { fromError } from "zod-validation-error";
import admin from "firebase-admin";
import * as calendar from "./calendar";
import { sendNotificationEmail } from "./email";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq, and, inArray, desc, asc, sql } from "drizzle-orm";

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Check if we have service account credentials
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccount) {
    // Production: Use service account JSON
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "classbeyond-17da2",
    });
  } else {
    // Development: Use project ID only (requires Firebase Auth to be in test mode)
    // Or set GCLOUD_PROJECT environment variable
    console.warn("⚠️  Firebase Admin SDK: No service account found. Using project ID only.");
    console.warn("⚠️  For production, add FIREBASE_SERVICE_ACCOUNT_KEY to .env");
    
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "classbeyond-17da2",
    });
  }
}

// Middleware to verify Firebase ID token
async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 verifyFirebaseToken - Auth header present:', !!authHeader);
    console.log('🔐 verifyFirebaseToken - Full auth header:', authHeader?.substring(0, 50) + '...');
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ verifyFirebaseToken - No token provided');
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log('🔑 verifyFirebaseToken - Token length:', token.length);
    console.log('🔑 verifyFirebaseToken - Token preview:', token.substring(0, 20) + '...' + token.substring(token.length - 20));
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ verifyFirebaseToken - Token decoded, email:', decodedToken.email);
    
    // Attach Firebase user to request
    req.user = await storage.getUserByEmail(decodedToken.email!);
    
    if (!req.user) {
      console.log('❌ verifyFirebaseToken - User not found in database:', decodedToken.email);
      return res.status(401).json({ error: "User not found in database" });
    }
    
    console.log('✅ verifyFirebaseToken - User authenticated:', req.user.email, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.error("❌ Firebase token verification error:", error);
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
}

// Middleware to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Middleware to require specific role
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('🔒 requireRole - Checking role, user present:', !!req.user);
    if (!req.user) {
      console.log('❌ requireRole - No user on request');
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = req.user as any;
    console.log('👤 requireRole - User role:', user.role, 'Required roles:', roles);
    
    // Restrict admin access to specific email only (only check when user's role is admin)
    if (user.role === "admin" && user.email !== "ariikmathiang@gmail.com") {
      return res.status(403).json({ error: "Admin access denied - unauthorized email" });
    }
    
    if (!roles.includes(user.role)) {
      console.log('❌ requireRole - Role mismatch');
      return res.status(403).json({ error: "Forbidden" });
    }
    console.log('✅ requireRole - Role check passed');
    next();
  };
}

// Helper function to create notification with email
async function createNotificationWithEmail(
  userId: string,
  type: "mentorship_request" | "mentorship_approved" | "mentorship_scheduled" | "badge_earned" | "lesson_available" | "quiz_reminder",
  message: string,
  relatedId?: string
): Promise<void> {
  try {
    // Create in-app notification
    await storage.createNotification({
      userId,
      type,
      message,
      relatedId: relatedId || null,
    });

    // Send email notification
    const user = await storage.getUserById(userId);
    if (user && user.email) {
      await sendNotificationEmail({
        recipientEmail: user.email,
        recipientName: user.firstName || "User",
        type,
        message,
        relatedId,
      });
    }
  } catch (error) {
    console.error("Error creating notification with email:", error);
    // Don't throw - we don't want email failures to break the main flow
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============= Authentication Routes =============
  
  // Sync Firebase user to database
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Check if user exists
      let user = await storage.getUserByEmail(decodedToken.email!);
      
      if (!user) {
        // Create new user from Firebase auth
        const { username, role } = req.body;
        
        console.log("🔍 Creating new user:", { 
          email: decodedToken.email, 
          username, 
          role,
          body: req.body 
        });
        
        // Prevent anyone except ariikmathiang@gmail.com from creating admin accounts
        if (role === "admin" && decodedToken.email !== "ariikmathiang@gmail.com") {
          return res.status(403).json({ error: "Admin role is restricted" });
        }
        
        // Get display name from Firebase if available
        const firebaseUser = await admin.auth().getUser(decodedToken.uid);
        const displayName = firebaseUser.displayName;
        let firstName = username;
        let lastName = undefined;
        
        // Try to parse display name into first and last name
        if (displayName && !username) {
          const nameParts = displayName.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ') || undefined;
        }
        
        // Fallback to email username if no name provided
        if (!firstName) {
          firstName = decodedToken.email!.split('@')[0];
        }
        
        user = await storage.createUser({
          email: decodedToken.email!,
          firstName,
          lastName,
          role: role || "student",
        });
        
        console.log("✅ User created:", { id: user.id, email: user.email, role: user.role });
      } else {
        // User exists - update role if provided and different
        const { role } = req.body;
        if (role && role !== user.role) {
          console.log("🔄 Updating user role:", { 
            email: user.email, 
            oldRole: user.role, 
            newRole: role 
          });
          
          // Update user role in database
          const [updatedUser] = await db
            .update(users)
            .set({ role: role as any })
            .where(eq(users.id, user.id))
            .returning();
          
          user = updatedUser;
          console.log("✅ User role updated:", { id: user.id, email: user.email, role: user.role });
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("User sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });
  
  // Get current user
  app.get("/api/user", verifyFirebaseToken, requireAuth, (req, res) => {
    res.json(req.user);
  });

  // Update current user's role (for fixing incorrect signups)
  app.patch("/api/user/role", verifyFirebaseToken, requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { role } = req.body;

      if (!role || !['student', 'teacher', 'mentor', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Prevent changing to admin unless you're the designated admin
      if (role === 'admin' && user.email !== 'ariikmathiang@gmail.com') {
        return res.status(403).json({ error: "Admin role is restricted" });
      }

      const [updatedUser] = await db
        .update(users)
        .set({ role: role as any })
        .where(eq(users.id, user.id))
        .returning();

      console.log("✅ User role updated:", { 
        id: updatedUser.id, 
        email: updatedUser.email, 
        oldRole: user.role,
        newRole: updatedUser.role 
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Role update error:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // Delete user by email (for development/testing)
  app.delete("/api/admin/users/:email", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      
      // Delete from database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Delete from Firebase Auth
      try {
        await admin.auth().getUserByEmail(email).then(userRecord => {
          return admin.auth().deleteUser(userRecord.uid);
        });
      } catch (firebaseError) {
        console.error("Firebase deletion error:", firebaseError);
        // Continue even if Firebase deletion fails
      }
      
      // Delete from database
      await db.delete(users).where(eq(users.email, email));
      
      res.json({ success: true, message: `User ${email} deleted successfully` });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ============= Student Routes =============
  // Get all lessons (filtered by grade/subject)
  // Public lessons endpoint for unauthenticated users
  app.get("/api/public-lessons", async (req, res) => {
    try {
      const { gradeLevel, subject } = req.query;
      const filters: any = {};
      if (gradeLevel) filters.gradeLevel = parseInt(gradeLevel as string);
      if (subject) filters.subject = subject as string;
      const allLessons = await storage.getAllLessons(filters);
      const lessons = allLessons.filter(l => l.isApproved === true);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Authenticated lessons endpoint
  app.get("/api/lessons", verifyFirebaseToken, requireAuth, async (req, res) => {
    try {
      const { gradeLevel, subject } = req.query;
      const filters: any = {};
      if (gradeLevel) filters.gradeLevel = parseInt(gradeLevel as string);
      if (subject) filters.subject = subject as string;
      
      console.log('📚 /api/lessons request:', { filters, user: req.user?.email });
      
      const allLessons = await storage.getAllLessons(filters);
      console.log('📚 Total lessons from DB:', allLessons.length);
      
      const lessons = allLessons.filter(l => l.isApproved === true);
      console.log('📚 Approved lessons:', lessons.length);
      
      res.json(lessons);
    } catch (error) {
      console.error('❌ Error fetching lessons:', error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Get specific lesson
  app.get("/api/lessons/:id", verifyFirebaseToken, requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const lesson = await storage.getLesson(id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      console.log(`📖 Serving lesson ${id}:`, {
        title: lesson.title,
        hasContent: !!lesson.content,
        contentLength: lesson.content?.length || 0,
        contentPreview: lesson.content?.substring(0, 100) || '(empty)'
      });
      
      // Also fetch the quiz if it exists (quiz questions are already in the jsonb field)
      const quizzes = await storage.getQuizzesByLesson(id);
      const quiz = quizzes.length > 0 ? quizzes[0] : null;
      
      res.json({
        ...lesson,
        quiz: quiz,
        externalContent: lesson.externalContent || []
      });
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
  app.post("/api/quizzes/:id/submit", verifyFirebaseToken, requireRole("student"), async (req, res) => {
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
        metadata: { quizId, score: submission.score },
      });

      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Get student's progress
  app.get("/api/student/progress", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const progress = await storage.getProgressByUser(user.id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Update lesson progress
  app.post("/api/student/progress", verifyFirebaseToken, requireRole("student"), async (req, res) => {
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

  // Enroll in a lesson
  app.post("/api/student/enroll/:lessonId", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const lessonId = req.params.lessonId;

      // Check if already enrolled
      const existingProgress = await db
        .select()
        .from(studentProgress)
        .where(
          and(
            eq(studentProgress.studentId, user.id),
            eq(studentProgress.lessonId, lessonId)
          )
        )
        .limit(1);

      if (existingProgress.length > 0) {
        return res.json({ message: "Already enrolled", progress: existingProgress[0] });
      }

      // Create progress entry (enrollment)
      const progress = await storage.createOrUpdateProgress({
        studentId: user.id,
        lessonId: lessonId,
        completed: false,
      });

      res.json({ message: "Enrolled successfully", progress });
    } catch (error) {
      console.error("Enrollment error:", error);
      res.status(500).json({ error: "Failed to enroll in lesson" });
    }
  });

  // Get student's badges
  app.get("/api/student/badges", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const badges = await storage.getBadgesByUser(user.id);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Get student's quiz submissions
  app.get("/api/student/submissions", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const submissions = await storage.getQuizSubmissionsByStudent(user.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Request mentorship
  app.post("/api/student/request-mentorship", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const { mentorId, subject, requestMessage } = req.body;
      
      const validationResult = insertMentorshipSessionSchema.safeParse({
        studentId: user.id,
        mentorId: mentorId || null, // Use specified mentor or null
        subject,
        requestMessage,
        scheduledAt: null,
        status: mentorId ? "pending" : "requested", // pending if mentor specified, requested otherwise
      });

      if (!validationResult.success) {
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }

      const session = await storage.createMentorshipSession(validationResult.data);
      
      // Create notification for the specified mentor or all mentors
      if (mentorId) {
        await createNotificationWithEmail(
          mentorId,
          "mentorship_request",
          `New mentorship request for ${subject} from ${user.firstName}`,
          session.id.toString()
        );
      } else {
        const mentors = await storage.getUsersByRole("mentor");
        for (const mentor of mentors) {
          await createNotificationWithEmail(
            mentor.id,
            "mentorship_request",
            `New mentorship request for ${subject}`,
            session.id.toString()
          );
        }
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create mentorship request" });
    }
  });

  // Get student's mentorship sessions
  app.get("/api/student/sessions", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const sessions = await storage.getMentorshipSessionsByStudent(user.id);
      
      // Enrich sessions with mentor details
      const enrichedSessions = await Promise.all(
        sessions.map(async (session) => {
          if (session.mentorId) {
            const mentor = await storage.getUserById(session.mentorId);
            if (mentor) {
              const firstName = mentor.firstName || '';
              const lastName = mentor.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim();
              return {
                ...session,
                mentorName: fullName || mentor.email?.split('@')[0] || "Unknown Mentor",
              };
            }
          }
          return {
            ...session,
            mentorName: "Unknown Mentor",
          };
        })
      );
      
      console.log(`📚 Student ${user.email} has ${enrichedSessions.length} sessions`);
      console.log(`📅 Scheduled sessions: ${enrichedSessions.filter(s => s.status === 'scheduled').length}`);
      
      res.json(enrichedSessions);
    } catch (error) {
      console.error("Error fetching student sessions:", error);
      res.status(500).json({ error: "Failed to fetch student sessions" });
    }
  });

  // Get available mentors (optionally filtered by subject)
  app.get("/api/mentors/available", verifyFirebaseToken, requireAuth, async (req, res) => {
    try {
      const subject = req.query.subject as string | undefined;
      
      console.log("🔍 Fetching all mentors, subject filter:", subject || "none");
      
      // Get ALL users with mentor role
      const allMentors = await storage.getUsersByRole("mentor");
      
      console.log("✅ Found mentors:", allMentors.length);
      if (allMentors.length > 0) {
        console.log("📋 Mentor details:", allMentors.map(m => ({ 
          id: m.id, 
          name: `${m.firstName} ${m.lastName}`,
          email: m.email, 
          role: m.role 
        })));
      } else {
        console.log("⚠️ No mentors found in database!");
      }
      
      // Enhance mentor data with profile information
      const enhancedMentors = await Promise.all(
        allMentors.map(async (mentor) => {
          const profile = await storage.getMentorProfile(mentor.id);
          
          console.log(`👤 Mentor ${mentor.email} - Has profile: ${!!profile}, Active: ${profile?.isActive ?? 'no profile'}`);
          
          // Extract display name from email if firstName/lastName are missing
          let displayFirstName = mentor.firstName;
          let displayLastName = mentor.lastName;
          
          if (!displayFirstName && !displayLastName && mentor.email) {
            // Extract username from email (before @)
            const emailUsername = mentor.email.split('@')[0];
            // Capitalize first letter
            displayFirstName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
            displayLastName = "";
          }
          
          // If profile exists, use it; otherwise create default profile data
          if (profile) {
            return {
              ...mentor,
              firstName: displayFirstName,
              lastName: displayLastName,
              bio: profile.bio || "Dedicated mentor helping students succeed.",
              expertise: (profile.expertise as string[]) || [],
              experience: profile.experience,
              education: profile.education,
              sessionsCompleted: profile.totalSessions || 0,
              rating: (profile.averageRating || 0) / 100, // Convert from integer to decimal (450 -> 4.5)
              hourlyRate: profile.hourlyRate,
              isActive: profile.isActive ?? true, // Include active status
            };
          } else {
            // Return mentor with default values if no profile exists
            return {
              ...mentor,
              firstName: displayFirstName,
              lastName: displayLastName,
              bio: `Experienced ${subject || "education"} mentor dedicated to helping students succeed.`,
              expertise: subject === "math" 
                ? ["Algebra", "Geometry", "Calculus"]
                : subject === "english"
                ? ["Grammar", "Literature", "Writing"]
                : subject === "science"
                ? ["Biology", "Chemistry", "Physics"]
                : ["Math", "English", "Science"],
              sessionsCompleted: 0,
              rating: 5.0, // Default good rating for new mentors
              isActive: true, // Show new mentors by default
            };
          }
        })
      );
      
      // Return ALL mentors (don't filter by isActive here - let frontend decide)
      console.log(`✅ Returning ${enhancedMentors.length} mentors to client`);
      res.json(enhancedMentors);
    } catch (error) {
      console.error("❌ Error fetching mentors:", error);
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  // Get student's mentorship sessions
  app.get("/api/student/mentorship-sessions", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const sessions = await storage.getMentorshipSessionsByStudent(user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentorship sessions" });
    }
  });

  // Get student's upcoming sessions (including Google Calendar)
  app.get("/api/student/upcoming-sessions", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get sessions from database
      const sessions = await storage.getMentorshipSessionsByStudent(user.id);
      console.log(`📚 Student ${user.email} has ${sessions.length} total sessions`);
      
      if (sessions.length > 0) {
        console.log('📋 All sessions:', sessions.map(s => ({
          id: s.id,
          status: s.status,
          scheduledAt: s.scheduledAt,
          subject: s.subject,
          mentorId: s.mentorId
        })));
      }
      
      const upcomingDbSessions = sessions.filter(s => {
        const isScheduled = s.status === "scheduled";
        const hasScheduledAt = !!s.scheduledAt;
        const isFuture = s.scheduledAt ? new Date(s.scheduledAt) > new Date() : false;
        
        if (sessions.length > 0) {
          console.log(`Session ${s.id}: status=${s.status} (scheduled=${isScheduled}), hasDate=${hasScheduledAt}, scheduledAt=${s.scheduledAt}, future=${isFuture}, now=${new Date().toISOString()}`);
        }
        
        return isScheduled && hasScheduledAt && isFuture;
      });
      
      console.log(`✅ Found ${upcomingDbSessions.length} upcoming sessions`);

      // Enrich with mentor details
      const enrichedSessions = await Promise.all(
        upcomingDbSessions.map(async (session) => {
          if (session.mentorId) {
            const mentor = await storage.getUserById(session.mentorId);
            if (mentor) {
              const firstName = mentor.firstName || '';
              const lastName = mentor.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim();
              return {
                ...session,
                mentorName: fullName || mentor.email?.split('@')[0] || "Unknown Mentor",
              };
            }
          }
          return {
            ...session,
            mentorName: "Unknown Mentor",
          };
        })
      );

      // Get Google Calendar events if user has connected calendar
      let calendarEvents: any[] = [];
      if (user.googleCalendarToken) {
        try {
          const events = await calendar.getUpcomingEvents(user.googleCalendarToken, 10);
          calendarEvents = events.map((event: any) => ({
            id: event.id,
            summary: event.summary || 'Mentorship Session',
            description: event.description || '',
            scheduledAt: event.start?.dateTime || event.start?.date,
            meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
            attendees: event.attendees?.map((a: any) => a.email) || [],
            source: 'google_calendar',
          }));
        } catch (calendarError) {
          console.error('Failed to fetch Google Calendar events:', calendarError);
        }
      }

      // Combine both sources
      const allSessions = [
        ...enrichedSessions.map(s => ({ ...s, source: 'database' })),
        ...calendarEvents,
      ];

      // Sort by scheduled time
      allSessions.sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      
      console.log(`📅 Student ${user.email} has ${allSessions.length} upcoming sessions`);
      if (allSessions.length > 0) {
        console.log('📋 Session details:', allSessions.map(s => ({
          id: s.id,
          subject: s.subject,
          scheduledAt: s.scheduledAt,
          status: s.status,
          meetingLink: s.meetingLink
        })));
      }

      res.json(allSessions);
    } catch (error) {
      console.error('Failed to fetch upcoming sessions:', error);
      res.status(500).json({ error: "Failed to fetch upcoming sessions" });
    }
  });

  // ============= Mentor Profile Routes =============
  // Get or create mentor profile
  app.get("/api/mentor/profile", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
    try {
      const user = req.user as any;
      let profile = await storage.getMentorProfile(user.id);
      
      if (!profile) {
        // Create default profile if it doesn't exist
        profile = await storage.createMentorProfile({
          mentorId: user.id,
          bio: null,
          expertise: [],
          experience: null,
          education: null,
          availability: [],
          hourlyRate: null,
          totalSessions: 0,
          averageRating: 0,
          isActive: true,
        });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentor profile" });
    }
  });

  // Update mentor profile
  app.patch("/api/mentor/profile", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
    try {
      const user = req.user as any;
      const { bio, expertise, experience, education, availability, hourlyRate, isActive } = req.body;
      
      const profile = await storage.updateMentorProfile(user.id, {
        bio,
        expertise,
        experience,
        education,
        availability,
        hourlyRate,
        isActive,
      });
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mentor profile" });
    }
  });

  // Get mentor reviews
  app.get("/api/mentor/reviews", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
    try {
      const user = req.user as any;
      const reviews = await storage.getReviewsByMentor(user.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Student: Leave a review for a mentor
  app.post("/api/mentor/:mentorId/review", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const { mentorId } = req.params;
      const { rating, review, sessionId } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }
      
      const newReview = await storage.createMentorReview({
        mentorId,
        studentId: user.id,
        sessionId: sessionId || null,
        rating,
        review,
      });
      
      res.json(newReview);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Get reviews for a specific mentor (public endpoint)
  app.get("/api/mentor/:mentorId/reviews", verifyFirebaseToken, requireAuth, async (req, res) => {
    try {
      const { mentorId } = req.params;
      const reviews = await storage.getReviewsByMentor(mentorId);
      
      // Enhance with student names
      const enhancedReviews = await Promise.all(
        reviews.map(async (review) => {
          const student = await storage.getUserById(review.studentId);
          return {
            ...review,
            studentName: student ? `${student.firstName} ${student.lastName}` : "Anonymous",
          };
        })
      );
      
      res.json(enhancedReviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // ============= Teacher Routes =============
  // Create lesson
  app.post("/api/teacher/lessons", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
    try {
      console.log("📝 Lesson data received:", JSON.stringify(req.body, null, 2));
      
      const validationResult = insertLessonSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.log("❌ Validation failed:", validationResult.error);
        return res.status(400).json({ error: fromError(validationResult.error).toString() });
      }

      // Explicitly set isApproved to false for new lessons
      const lessonData = {
        ...validationResult.data,
        isApproved: false,
      };

      const lesson = await storage.createLesson(lessonData);
      console.log("✅ Lesson created:", lesson.id);
      // Create audit log
      const user = req.user as any;
      await storage.createAuditLog({
        userId: user.id,
        action: "lesson_create",
        metadata: { lessonId: lesson.id, title: lesson.title },
      });

      // Notify all admins about new lesson submission
      try {
        const admins = await storage.getUsersByRole("admin");
        for (const adminUser of admins) {
          await storage.createNotification({
            userId: adminUser.id,
            type: "lesson_available", // Reuse type for lesson submission
            message: `New lesson "${lesson.title}" submitted by ${user.firstName || "Teacher"}. Please review for approval.`,
            relatedId: lesson.id,
          });
          // Optionally send email (uncomment if desired)
          // if (adminUser.email) {
          //   await sendNotificationEmail({
          //     recipientEmail: adminUser.email,
          //     recipientName: adminUser.firstName || "Admin",
          //     type: "lesson_available",
          //     message: `A new lesson "${lesson.title}" has been submitted for approval by ${user.firstName || "Teacher"}.`,
          //     relatedId: lesson.id,
          //   });
          // }
        }
      } catch (notifyErr) {
        console.error("Error notifying admins of new lesson submission:", notifyErr);
      }

      res.json(lesson);
    } catch (error) {
      console.error("❌ Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // Update lesson
  app.patch("/api/teacher/lessons/:id", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
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
  app.post("/api/teacher/quizzes", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
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
  app.get("/api/mentor/stats", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
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
  app.get("/api/mentor/pending-requests", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
    try {
      const requests = await storage.getPendingMentorshipRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  // Get all mentor sessions (for sessions page)
  app.get("/api/mentor/sessions", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
    try {
      const user = req.user as any;
      const sessions = await storage.getMentorshipSessionsByMentor(user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Get upcoming sessions
  app.get("/api/mentor/upcoming-sessions", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get sessions from database
      const sessions = await storage.getMentorshipSessionsByMentor(user.id);
      const upcomingDbSessions = sessions.filter(s => 
        s.status === "scheduled" && 
        s.scheduledAt && 
        new Date(s.scheduledAt) > new Date()
      );

      // Get Google Calendar events if user has connected calendar
      let calendarEvents: any[] = [];
      if (user.googleCalendarToken) {
        try {
          const events = await calendar.getUpcomingEvents(user.googleCalendarToken, 10);
          calendarEvents = events.map((event: any) => ({
            id: event.id,
            summary: event.summary || 'Mentorship Session',
            description: event.description || '',
            scheduledAt: event.start?.dateTime || event.start?.date,
            meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
            attendees: event.attendees?.map((a: any) => a.email) || [],
            source: 'google_calendar',
          }));
        } catch (calendarError) {
          console.error('Failed to fetch Google Calendar events:', calendarError);
        }
      }

      // Combine both sources
      const allSessions = [
        ...upcomingDbSessions.map(s => ({ ...s, source: 'database' })),
        ...calendarEvents,
      ];

      // Sort by scheduled time
      allSessions.sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

      res.json(allSessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming sessions" });
    }
  });

  // Update mentorship session
  app.patch("/api/mentor/sessions/:id", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
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
        await createNotificationWithEmail(
          session.studentId,
          "mentorship_approved",
          "Your mentorship request has been approved!",
          session.id
        );
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // ============= Student Dashboard Routes =============
  app.get("/api/student/stats", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const progress = await storage.getProgressByUser(user.id);
      const submissions = await storage.getQuizSubmissionsByStudent(user.id);
      const badges = await storage.getBadgesByUser(user.id);
      const allLessons = await storage.getAllLessons({});
      const lessons = allLessons.filter(l => l.isApproved === true);
      
      const completedLessons = progress.filter(p => p.completed).length;
      const avgScore = submissions.length > 0
        ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
        : 0;
      
      const stats = {
        completedLessons,
        totalLessons: lessons.length,
        badges: badges.length,
        averageScore: avgScore,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student stats" });
    }
  });

  app.get("/api/student/recent-lessons", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const progress = await storage.getProgressByUser(user.id);
      const allLessons = await storage.getAllLessons({});
      const lessons = allLessons.filter(l => l.isApproved === true);
      
      // Get lessons with progress
      const lessonsWithProgress = lessons.slice(0, 4).map(lesson => {
        const lessonProgress = progress.find(p => p.lessonId === lesson.id);
        return {
          ...lesson,
          completed: lessonProgress?.completed || false,
          lastAccessed: lessonProgress?.lastAccessedAt,
        };
      });
      
      res.json(lessonsWithProgress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent lessons" });
    }
  });

  app.get("/api/student/recent-badges", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const badges = await storage.getBadgesByUser(user.id);
      res.json(badges.slice(0, 4));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent badges" });
    }
  });

  // ============= Teacher Dashboard Routes =============
  // Get teacher's own lessons
  app.get("/api/teacher/my-lessons", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
    try {
      const user = req.user as any;
      const lessons = await db
        .select({
          id: lessonsTable.id,
          title: lessonsTable.title,
          subject: lessonsTable.subject,
          description: lessonsTable.description,
          content: lessonsTable.content,
          level: lessonsTable.level,
          teacherId: lessonsTable.teacherId,
          externalContent: lessonsTable.externalContent,
          isApproved: lessonsTable.isApproved,
          approvedBy: lessonsTable.approvedBy,
          createdAt: lessonsTable.createdAt,
          updatedAt: lessonsTable.updatedAt,
        })
        .from(lessonsTable)
        .where(eq(lessonsTable.teacherId, user.id))
        .orderBy(desc(lessonsTable.createdAt));
      
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching teacher lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/teacher/stats", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get teacher's own lessons
      const teacherLessons = await db
        .select()
        .from(lessonsTable)
        .where(eq(lessonsTable.teacherId, user.id));
      
      const totalLessons = teacherLessons.length;
      const approvedLessons = teacherLessons.filter(l => l.isApproved).length;
      
      // Get quiz submissions for teacher's lessons
      const lessonIds = teacherLessons.map(l => l.id);
      let quizSubmissionsCount = 0;
      let totalScore = 0;
      
      if (lessonIds.length > 0) {
        const teacherQuizzes = await db
          .select()
          .from(quizzes)
          .where(inArray(quizzes.lessonId, lessonIds));
        
        const quizIds = teacherQuizzes.map(q => q.id);
        
        if (quizIds.length > 0) {
          const submissions = await db
            .select()
            .from(quizSubmissions)
            .where(inArray(quizSubmissions.quizId, quizIds));
          
          quizSubmissionsCount = submissions.length;
          
          if (submissions.length > 0) {
            totalScore = submissions.reduce((sum, sub) => {
              return sum + ((sub.score / sub.totalQuestions) * 100);
            }, 0);
          }
        }
      }
      
      const avgPerformance = quizSubmissionsCount > 0 ? Math.round(totalScore / quizSubmissionsCount) : 0;
      
      const stats = {
        totalLessons,
        approvedLessons,
        activeStudents: 0, // Can be calculated from student progress later
        quizSubmissions: quizSubmissionsCount,
        avgPerformance,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ error: "Failed to fetch teacher stats" });
    }
  });

  app.get("/api/teacher/recent-activity", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
    try {
      const students = await storage.getUsersByRole("student");
      
      // Mock recent activity data
      const activity = students.slice(0, 5).map((student, index) => ({
        id: `activity-${index}`,
        studentName: `${student.firstName} ${student.lastName}`,
        type: index % 2 === 0 ? "quiz" : "lesson",
        description: index % 2 === 0 ? "Completed Math Quiz" : "Completed Science Lesson",
        score: 70 + Math.floor(Math.random() * 30),
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }));
      
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  app.get("/api/teacher/progress", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get teacher's lessons
      const teacherLessons = await db
        .select()
        .from(lessonsTable)
        .where(eq(lessonsTable.teacherId, user.id));
      
      const lessonIds = teacherLessons.map(l => l.id);
      
      if (lessonIds.length === 0) {
        return res.json({
          avgCompletionRate: 0,
          avgQuizScore: 0,
          activeStudents: 0,
          totalLessonsCompleted: 0,
          topPerformers: [],
          lessonPerformance: [],
          quizPerformance: [],
          weeklyEngagement: []
        });
      }

      // Get all student progress for teacher's lessons
      const allProgress = await db
        .select({
          studentId: studentProgress.studentId,
          lessonId: studentProgress.lessonId,
          completed: studentProgress.completed,
          completedAt: studentProgress.completedAt,
          lastAccessedAt: studentProgress.lastAccessedAt,
        })
        .from(studentProgress)
        .where(inArray(studentProgress.lessonId, lessonIds));

      // Calculate completion rate
      const totalEnrollments = allProgress.length;
      const completedLessons = allProgress.filter(p => p.completed).length;
      const avgCompletionRate = totalEnrollments > 0 
        ? Math.round((completedLessons / totalEnrollments) * 100) 
        : 0;

      // Get quizzes for teacher's lessons
      const teacherQuizzes = await db
        .select()
        .from(quizzes)
        .where(inArray(quizzes.lessonId, lessonIds));
      
      const quizIds = teacherQuizzes.map(q => q.id);
      
      // Get quiz submissions
      let avgQuizScore = 0;
      let quizSubmissionsData: any[] = [];
      let studentScores: Map<string, { total: number, count: number, completed: number }> = new Map();
      
      if (quizIds.length > 0) {
        quizSubmissionsData = await db
          .select()
          .from(quizSubmissions)
          .where(inArray(quizSubmissions.quizId, quizIds))
          .orderBy(desc(quizSubmissions.submittedAt));
        
        if (quizSubmissionsData.length > 0) {
          const totalScore = quizSubmissionsData.reduce((sum, sub) => {
            const score = (sub.score / sub.totalQuestions) * 100;
            
            // Track per student
            const studentData = studentScores.get(sub.studentId) || { total: 0, count: 0, completed: 0 };
            studentData.total += score;
            studentData.count += 1;
            studentScores.set(sub.studentId, studentData);
            
            return sum + score;
          }, 0);
          avgQuizScore = Math.round(totalScore / quizSubmissionsData.length);
        }
      }

      // Track completed lessons per student
      allProgress.forEach(p => {
        if (p.completed) {
          const studentData = studentScores.get(p.studentId) || { total: 0, count: 0, completed: 0 };
          studentData.completed += 1;
          studentScores.set(p.studentId, studentData);
        }
      });

      // Get student details for top performers
      const studentIds = Array.from(studentScores.keys());
      const students = studentIds.length > 0 
        ? await db.select().from(users).where(inArray(users.id, studentIds))
        : [];

      // Calculate top performers
      const topPerformers = Array.from(studentScores.entries())
        .map(([studentId, data]) => {
          const student = students.find(s => s.id === studentId);
          return {
            studentId,
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
            lessonsCompleted: data.completed,
            avgScore: data.count > 0 ? Math.round(data.total / data.count) : 0
          };
        })
        .filter(p => p.lessonsCompleted > 0 || p.avgScore > 0)
        .sort((a, b) => {
          // Sort by lessons completed first, then by avg score
          if (b.lessonsCompleted !== a.lessonsCompleted) {
            return b.lessonsCompleted - a.lessonsCompleted;
          }
          return b.avgScore - a.avgScore;
        })
        .slice(0, 10);

      // Lesson performance data
      const lessonPerformance = await Promise.all(
        teacherLessons.slice(0, 10).map(async (lesson) => {
          const lessonProgress = allProgress.filter(p => p.lessonId === lesson.id);
          const completions = lessonProgress.filter(p => p.completed).length;
          
          const lessonQuizzes = teacherQuizzes.filter(q => q.lessonId === lesson.id);
          const lessonQuizIds = lessonQuizzes.map(q => q.id);
          
          let avgScore = 0;
          if (lessonQuizIds.length > 0) {
            const lessonSubmissions = quizSubmissionsData.filter(s => lessonQuizIds.includes(s.quizId));
            if (lessonSubmissions.length > 0) {
              const total = lessonSubmissions.reduce((sum, sub) => 
                sum + ((sub.score / sub.totalQuestions) * 100), 0
              );
              avgScore = Math.round(total / lessonSubmissions.length);
            }
          }
          
          return {
            lesson: lesson.title,
            avgScore,
            completions
          };
        })
      );

      // Quiz performance trends (last 10 quizzes)
      const quizPerformance = teacherQuizzes.slice(0, 10).map(quiz => {
        const submissions = quizSubmissionsData.filter(s => s.quizId === quiz.id);
        const avgScore = submissions.length > 0
          ? Math.round(submissions.reduce((sum, sub) => 
              sum + ((sub.score / sub.totalQuestions) * 100), 0
            ) / submissions.length)
          : 0;
        
        return {
          name: quiz.title,
          avgScore
        };
      });

      // Weekly engagement (last 4 weeks)
      const now = new Date();
      const weeklyEngagement = [3, 2, 1, 0].map(weeksAgo => {
        const weekStart = new Date(now.getTime() - (weeksAgo * 7 * 24 * 60 * 60 * 1000));
        const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
        
        const weekProgress = allProgress.filter(p => {
          const accessDate = new Date(p.lastAccessedAt || 0);
          return accessDate >= weekStart && accessDate < weekEnd;
        });
        
        const uniqueStudents = new Set(weekProgress.map(p => p.studentId)).size;
        const completed = weekProgress.filter(p => p.completed).length;
        
        return {
          week: `Week ${4 - weeksAgo}`,
          active: uniqueStudents,
          completed
        };
      });

      // Active students this week
      const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const activeStudents = new Set(
        allProgress
          .filter(p => new Date(p.lastAccessedAt || 0) >= oneWeekAgo)
          .map(p => p.studentId)
      ).size;

      res.json({
        avgCompletionRate,
        avgQuizScore,
        activeStudents,
        totalLessonsCompleted: completedLessons,
        topPerformers,
        lessonPerformance,
        quizPerformance,
        weeklyEngagement
      });
    } catch (error) {
      console.error("Error fetching teacher progress:", error);
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  app.get("/api/teacher/students", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get all lessons by this teacher
      const teacherLessons = await db
        .select()
        .from(lessonsTable)
        .where(eq(lessonsTable.teacherId, user.id));
      
      const lessonIds = teacherLessons.map(l => l.id);
      
      if (lessonIds.length === 0) {
        return res.json([]);
      }
      
      // Get unique students who have progress in any of teacher's lessons
      const progressRecords = await db
        .select({
          studentId: studentProgress.studentId,
          student: users,
          progress: studentProgress,
        })
        .from(studentProgress)
        .innerJoin(users, eq(studentProgress.studentId, users.id))
        .where(inArray(studentProgress.lessonId, lessonIds));
      
      // Group by student and calculate stats
      const studentMap = new Map();
      
      progressRecords.forEach(record => {
        const studentId = record.studentId;
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: record.student.id,
            name: `${record.student.firstName || ''} ${record.student.lastName || ''}`.trim() || 'Student',
            email: record.student.email || '',
            progress: 0,
            lessonsCompleted: 0,
            totalLessons: 0,
            quizzesCompleted: 0,
            badgesEarned: 0,
            lastActive: record.progress.lastAccessedAt || new Date(),
          });
        }
        
        const student = studentMap.get(studentId);
        student.totalLessons++;
        if (record.progress.completed) {
          student.lessonsCompleted++;
        }
        
        // Update last active date
        if (record.progress.lastAccessedAt && record.progress.lastAccessedAt > student.lastActive) {
          student.lastActive = record.progress.lastAccessedAt;
        }
      });
      
      // Calculate progress percentage for each student
      const students = Array.from(studentMap.values()).map(student => ({
        ...student,
        progress: student.totalLessons > 0 
          ? Math.round((student.lessonsCompleted / student.totalLessons) * 100) 
          : 0,
      }));
      
      // Get quiz submissions for these students (for teacher's lessons)
      const studentIds = students.map(s => s.id);
      if (studentIds.length > 0) {
        const quizSubmissionsData = await db
          .select({
            studentId: quizSubmissions.studentId,
            quizId: quizSubmissions.quizId,
          })
          .from(quizSubmissions)
          .innerJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
          .where(
            and(
              inArray(quizSubmissions.studentId, studentIds),
              inArray(quizzes.lessonId, lessonIds)
            )
          );
        
        // Count quizzes per student
        const quizCounts = new Map();
        quizSubmissionsData.forEach(submission => {
          quizCounts.set(
            submission.studentId, 
            (quizCounts.get(submission.studentId) || 0) + 1
          );
        });
        
        // Get badges for these students
        const badgesData = await db
          .select({
            studentId: studentBadges.studentId,
          })
          .from(studentBadges)
          .where(inArray(studentBadges.studentId, studentIds));
        
        const badgeCounts = new Map();
        badgesData.forEach(badge => {
          badgeCounts.set(
            badge.studentId,
            (badgeCounts.get(badge.studentId) || 0) + 1
          );
        });
        
        // Update student records with quiz and badge counts
        students.forEach(student => {
          student.quizzesCompleted = quizCounts.get(student.id) || 0;
          student.badgesEarned = badgeCounts.get(student.id) || 0;
        });
      }
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching teacher students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/teacher/progress", verifyFirebaseToken, requireRole("teacher", "admin"), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get teacher's lessons
      const teacherLessons = await db
        .select()
        .from(lessonsTable)
        .where(eq(lessonsTable.teacherId, user.id));
      
      const lessonIds = teacherLessons.map(l => l.id);
      
      if (lessonIds.length === 0) {
        return res.json({
          totalStudents: 0,
          avgCompletionRate: 0,
          avgQuizScore: 0,
          activeStudents: 0,
          totalLessonsCompleted: 0,
          lessonIds: [],
        });
      }
      
      // Get all progress records for teacher's lessons
      const progressRecords = await db
        .select()
        .from(studentProgress)
        .where(inArray(studentProgress.lessonId, lessonIds));
      
      // Get quiz submissions for teacher's lessons
      const quizSubmissionsData = await db
        .select({
          quizId: quizSubmissions.quizId,
          studentId: quizSubmissions.studentId,
          score: quizSubmissions.score,
          totalQuestions: quizSubmissions.totalQuestions,
        })
        .from(quizSubmissions)
        .innerJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
        .where(inArray(quizzes.lessonId, lessonIds));
      
      // Calculate analytics
      const totalStudents = new Set(progressRecords.map(p => p.studentId)).size;
      const completedLessons = progressRecords.filter(p => p.completed).length;
      const totalProgress = progressRecords.length;
      const avgCompletionRate = totalProgress > 0 ? Math.round((completedLessons / totalProgress) * 100) : 0;
      
      // Calculate quiz performance
      const totalQuizScore = quizSubmissionsData.reduce((sum, s) => 
        sum + (s.score / s.totalQuestions) * 100, 0
      );
      const avgQuizScore = quizSubmissionsData.length > 0 
        ? Math.round(totalQuizScore / quizSubmissionsData.length) 
        : 0;
      
      // Active students (accessed in last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeStudents = progressRecords.filter(p => 
        p.lastAccessedAt && p.lastAccessedAt > weekAgo
      );
      const uniqueActiveStudents = new Set(activeStudents.map(p => p.studentId)).size;
      
      res.json({
        totalStudents,
        avgCompletionRate,
        avgQuizScore,
        activeStudents: uniqueActiveStudents,
        totalLessonsCompleted: completedLessons,
        lessonIds,
      });
    } catch (error) {
      console.error("Error fetching teacher progress:", error);
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  // ============= Admin Dashboard Routes =============
  app.get("/api/admin/stats", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsersByRole("student");
      const teachers = await storage.getUsersByRole("teacher");
      const mentors = await storage.getUsersByRole("mentor");
      const lessons = await storage.getAllLessons({});
      
      const totalUsers = users.length + teachers.length + mentors.length + 1; // +1 for admin
      
      // Calculate active users this week based on updatedAt (when they last modified their account)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const allUsers = [...users, ...teachers, ...mentors];
      const activeThisWeek = allUsers.filter(u => {
        if (!u.updatedAt) return false;
        return new Date(u.updatedAt) > oneWeekAgo;
      }).length;
      
      const stats = {
        totalUsers,
        activeThisWeek,
        totalLessons: lessons.length,
        pendingApproval: lessons.filter(l => !l.isApproved).length,
        totalQuizzes: 0, // Would need quiz submissions count
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/pending-approvals", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const lessons = await storage.getAllLessons({});
      console.log(`📚 Total lessons found: ${lessons.length}`);
      console.log(`📋 Lessons approval status:`, lessons.map(l => ({ 
        id: l.id, 
        title: l.title, 
        isApproved: l.isApproved,
        isApprovedType: typeof l.isApproved,
        truthyCheck: !l.isApproved,
        strictCheck: l.isApproved === false
      })));
      
      const pendingLessons = lessons
        .filter(l => l.isApproved === false)
        .slice(0, 10);
      
      console.log(`⏳ Pending lessons (isApproved === false): ${pendingLessons.length}`);
      
      // Fetch teacher names for each lesson
      const lessonsWithTeachers = await Promise.all(
        pendingLessons.map(async (lesson) => {
          const teacher = await storage.getUserById(lesson.teacherId);
          return {
            ...lesson,
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName || ''}`.trim() : "Unknown Teacher",
            createdAt: lesson.createdAt || new Date(),
          };
        })
      );
      
      res.json(lessonsWithTeachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  // Get users by role
  app.get("/api/admin/users/students", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsersByRole("student");
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/admin/users/teachers", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsersByRole("teacher");
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  app.get("/api/admin/users/mentors", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsersByRole("mentor");
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  // Approve lesson
  // Approve lesson
  app.patch("/api/admin/lessons/:id/approve", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const user = req.user as any;
      const lessonId = req.params.id;
      
      const lesson = await storage.updateLesson(lessonId, {
        isApproved: true,
        approvedBy: user.id,
      });
      
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "lesson_approve",
        metadata: { lessonId: lesson.id, title: lesson.title },
      });

      // Send notification to teacher
      await createNotificationWithEmail(
        lesson.teacherId,
        "lesson_available",
        `Your lesson "${lesson.title}" has been approved!`,
        lesson.id
      );
      
      res.json(lesson);
    } catch (error) {
      console.error("Approve lesson error:", error);
      res.status(500).json({ error: "Failed to approve lesson" });
    }
  });

  // Reject lesson
  app.delete("/api/admin/lessons/:id/reject", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const user = req.user as any;
      const lessonId = req.params.id;
      const { reason } = req.body; // Get rejection reason from request body
      
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      // Get teacher details
      const teacher = await storage.getUserById(lesson.teacherId);

      // Create audit log before deletion
      await storage.createAuditLog({
        userId: user.id,
        action: "lesson_reject",
        metadata: { 
          lessonId: lesson.id, 
          title: lesson.title,
          teacherId: lesson.teacherId,
          reason: reason || "No reason provided"
        },
      });

      // Send notification to teacher with rejection reason
      await storage.createNotification({
        userId: lesson.teacherId,
        type: "lesson_available", // Using existing type, could add "lesson_rejected"
        message: reason 
          ? `Your lesson "${lesson.title}" was rejected. Reason: ${reason}`
          : `Your lesson "${lesson.title}" was rejected by the admin.`,
      });

      // Send email to teacher with rejection reason
      if (teacher?.email) {
        await sendNotificationEmail({
          recipientEmail: teacher.email,
          recipientName: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher',
          type: "lesson_rejected",
          message: reason 
            ? `Your lesson "${lesson.title}" was rejected.\n\nReason: ${reason}\n\nPlease review the feedback and resubmit your lesson.`
            : `Your lesson "${lesson.title}" was rejected by the admin. Please contact support for more details.`,
          relatedId: lesson.id,
        });
      }

      const deleted = await storage.deleteLesson(lessonId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete lesson" });
      }
      
      res.json({ 
        success: true, 
        message: "Lesson rejected and teacher has been notified" 
      });
    } catch (error) {
      console.error("Reject lesson error:", error);
      res.status(500).json({ error: "Failed to reject lesson" });
    }
  });

  // Get all lessons for admin review
  app.get("/api/admin/lessons", verifyFirebaseToken, requireRole("admin"), async (req, res) => {
    try {
      const { status } = req.query;
      const lessons = await storage.getAllLessons({});
      
      console.log(`📚 Total lessons found: ${lessons.length}`);
      console.log(`📋 Lessons approval status:`, lessons.map(l => ({ id: l.id, title: l.title, isApproved: l.isApproved })));
      
      let filteredLessons = lessons;
      if (status === "pending") {
        filteredLessons = lessons.filter(l => l.isApproved === false);
        console.log(`⏳ Pending lessons (isApproved === false): ${filteredLessons.length}`);
      } else if (status === "approved") {
        filteredLessons = lessons.filter(l => l.isApproved === true);
        console.log(`✅ Approved lessons (isApproved === true): ${filteredLessons.length}`);
      }
      
      // Fetch teacher names
      const lessonsWithTeachers = await Promise.all(
        filteredLessons.map(async (lesson) => {
          const teacher = await storage.getUserById(lesson.teacherId);
          const approver = lesson.approvedBy ? await storage.getUserById(lesson.approvedBy) : null;
          return {
            ...lesson,
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName || ''}`.trim() : "Unknown",
            approverName: approver ? `${approver.firstName} ${approver.lastName || ''}`.trim() : null,
          };
        })
      );
      
      res.json(lessonsWithTeachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // ============= Google Calendar Integration =============
  
  // Get Google Calendar OAuth URL
  app.get("/api/calendar/auth-url", verifyFirebaseToken, requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const authUrl = calendar.getAuthUrl(user.id);
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  // Google Calendar OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).send("Missing code or state parameter");
      }

      const userId = state as string;
      const tokens = await calendar.getTokensFromCode(code as string);

      // Store tokens in database (you should encrypt these in production!)
      await storage.updateUser(userId, {
        googleCalendarToken: tokens.access_token || null,
        googleCalendarRefreshToken: tokens.refresh_token || null,
      });

      // Redirect back to the app
      res.redirect("/?calendar_connected=true");
    } catch (error) {
      console.error("Calendar OAuth error:", error);
      res.redirect("/?calendar_error=true");
    }
  });

  // Check if user has calendar connected
  app.get("/api/calendar/status", verifyFirebaseToken, requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const hasCalendar = !!(user.googleCalendarToken);
      res.json({ connected: hasCalendar });
    } catch (error) {
      res.status(500).json({ error: "Failed to check calendar status" });
    }
  });

  // Create calendar event when mentor schedules a session
  app.post("/api/mentor/sessions/:id/schedule", verifyFirebaseToken, requireRole("mentor"), async (req, res) => {
    try {
      const sessionId = req.params.id;
      const { scheduledAt, duration = 60, meetingLink: providedMeetingLink } = req.body;
      const mentor = req.user as any;

      if (!scheduledAt) {
        return res.status(400).json({ error: "scheduledAt is required" });
      }

      // Get session details
      const sessions = await storage.getMentorshipSessionsByMentor(mentor.id);
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Get student details
      const student = await storage.getUserById(session.studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Use provided meeting link or try to create one via Google Calendar
      let calendarEventId = null;
      let meetingLink = providedMeetingLink || null;

      // Only try Google Calendar if no meeting link was provided
      if (!meetingLink) {
        try {
          if (mentor.googleCalendarToken) {
            // Google Calendar API will automatically create a Meet link
            const eventId = await calendar.createMentorshipEvent(
              {
                studentName: `${student.firstName} ${student.lastName}`,
                studentEmail: student.email || '',
                mentorName: `${mentor.firstName} ${mentor.lastName}`,
                mentorEmail: mentor.email || '',
                subject: session.subject,
                description: session.requestMessage || 'Mentorship session',
                startTime: new Date(scheduledAt),
                duration,
              },
              mentor.googleCalendarToken
            );
            calendarEventId = eventId;
            
            // Fetch the created event to get the Meet link
            const auth = calendar.setUserCredentials(mentor.googleCalendarToken);
            const calendarService = google.calendar({ version: 'v3', auth });
            const event = await calendarService.events.get({
              calendarId: 'primary',
              eventId,
            });
            
            // Extract Meet link from conference data
            meetingLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.[0]?.uri;
          }
        } catch (calendarError) {
          console.error("Failed to create calendar event:", calendarError);
          // Don't generate fake links - just leave it null
          console.log("No meeting link available - mentor should provide one manually");
        }
      }

      // Update session with schedule and calendar info
      const updatedSession = await storage.updateMentorshipSession(sessionId, {
        scheduledAt: new Date(scheduledAt),
        status: "scheduled",
        googleCalendarEventId: calendarEventId,
        meetingLink,
        duration,
        mentorId: mentor.id,
      });

      // Notify student with or without Meet link
      const notificationMessage = meetingLink
        ? `Your ${session.subject} mentorship session has been scheduled for ${new Date(scheduledAt).toLocaleString()}. Join here: ${meetingLink}`
        : `Your ${session.subject} mentorship session has been scheduled for ${new Date(scheduledAt).toLocaleString()}. The mentor will provide the meeting link.`;
      
      await createNotificationWithEmail(
        student.id,
        "mentorship_scheduled",
        notificationMessage,
        sessionId
      );

      res.json(updatedSession);
    } catch (error) {
      console.error("Error scheduling session:", error);
      res.status(500).json({ error: "Failed to schedule session" });
    }
  });

  // ============= Q&A Forum =============
  // Get all forum questions with answers
  app.get("/api/forum/questions", verifyFirebaseToken, async (req, res) => {
    try {
      const questions = await db
        .select()
        .from(storage.forumQuestions)
        .orderBy(desc(storage.forumQuestions.createdAt));

      // Fetch answers for each question
      const questionsWithAnswers = await Promise.all(
        questions.map(async (question) => {
          const answers = await db
            .select({
              id: storage.forumAnswers.id,
              questionId: storage.forumAnswers.questionId,
              userId: storage.forumAnswers.userId,
              content: storage.forumAnswers.content,
              createdAt: storage.forumAnswers.createdAt,
              userFirstName: users.firstName,
              userLastName: users.lastName,
              userRole: users.role,
            })
            .from(storage.forumAnswers)
            .leftJoin(users, eq(storage.forumAnswers.userId, users.id))
            .where(eq(storage.forumAnswers.questionId, question.id))
            .orderBy(desc(storage.forumAnswers.createdAt));

          const student = await db
            .select()
            .from(users)
            .where(eq(users.id, question.studentId))
            .limit(1);

          return {
            ...question,
            studentName: student[0] ? `${student[0].firstName} ${student[0].lastName}` : "Unknown",
            answers: answers.map(a => ({
              id: a.id,
              questionId: a.questionId,
              userId: a.userId,
              userName: `${a.userFirstName} ${a.userLastName}`,
              userRole: a.userRole,
              answer: a.content,
              upvotes: 0,
              isAccepted: false,
              createdAt: a.createdAt,
            })),
          };
        })
      );

      res.json(questionsWithAnswers);
    } catch (error) {
      console.error("Error fetching forum questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Get student's own questions
  app.get("/api/forum/my-questions", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const questions = await db
        .select()
        .from(storage.forumQuestions)
        .where(eq(storage.forumQuestions.studentId, user.id))
        .orderBy(desc(storage.forumQuestions.createdAt));

      // Fetch answers for each question
      const questionsWithAnswers = await Promise.all(
        questions.map(async (question) => {
          const answers = await db
            .select({
              id: storage.forumAnswers.id,
              questionId: storage.forumAnswers.questionId,
              userId: storage.forumAnswers.userId,
              content: storage.forumAnswers.content,
              createdAt: storage.forumAnswers.createdAt,
              userFirstName: users.firstName,
              userLastName: users.lastName,
              userRole: users.role,
            })
            .from(storage.forumAnswers)
            .leftJoin(users, eq(storage.forumAnswers.userId, users.id))
            .where(eq(storage.forumAnswers.questionId, question.id))
            .orderBy(desc(storage.forumAnswers.createdAt));

          return {
            ...question,
            studentName: `${user.firstName} ${user.lastName}`,
            answers: answers.map(a => ({
              id: a.id,
              questionId: a.questionId,
              userId: a.userId,
              userName: `${a.userFirstName} ${a.userLastName}`,
              userRole: a.userRole,
              answer: a.content,
              upvotes: 0,
              isAccepted: false,
              createdAt: a.createdAt,
            })),
          };
        })
      );

      res.json(questionsWithAnswers);
    } catch (error) {
      console.error("Error fetching my questions:", error);
      res.status(500).json({ error: "Failed to fetch your questions" });
    }
  });

  // Post a new question
  app.post("/api/forum/questions", verifyFirebaseToken, requireRole("student"), async (req, res) => {
    try {
      const user = req.user as any;
      const { subject, question } = req.body;

      if (!subject || !question) {
        return res.status(400).json({ error: "Subject and question are required" });
      }

      const [newQuestion] = await db
        .insert(storage.forumQuestions)
        .values({
          studentId: user.id,
          subject,
          title: question.substring(0, 255), // Use first 255 chars as title
          content: question,
        })
        .returning();

      res.json(newQuestion);
    } catch (error) {
      console.error("Error posting question:", error);
      res.status(500).json({ error: "Failed to post question" });
    }
  });

  // Post an answer to a question
  app.post("/api/forum/questions/:questionId/answers", verifyFirebaseToken, async (req, res) => {
    try {
      const user = req.user as any;
      const { questionId } = req.params;
      const { answer } = req.body;

      if (!answer) {
        return res.status(400).json({ error: "Answer is required" });
      }

      const [newAnswer] = await db
        .insert(storage.forumAnswers)
        .values({
          questionId,
          userId: user.id,
          content: answer,
        })
        .returning();

      // Notify the question owner
      const question = await db
        .select()
        .from(storage.forumQuestions)
        .where(eq(storage.forumQuestions.id, questionId))
        .limit(1);

      if (question[0] && question[0].studentId !== user.id) {
        await createNotificationWithEmail(
          question[0].studentId,
          "forum_answer",
          `${user.firstName} ${user.lastName} answered your question`,
          questionId
        );
      }

      res.json(newAnswer);
    } catch (error) {
      console.error("Error posting answer:", error);
      res.status(500).json({ error: "Failed to post answer" });
    }
  });

  // Accept an answer (placeholder - no upvotes/acceptance in schema yet)
  app.patch("/api/forum/answers/:answerId/accept", verifyFirebaseToken, async (req, res) => {
    try {
      // This is a placeholder since the schema doesn't have isAccepted field
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept answer" });
    }
  });

  // Upvote an answer (placeholder)
  app.post("/api/forum/answers/:answerId/upvote", verifyFirebaseToken, async (req, res) => {
    try {
      // This is a placeholder since the schema doesn't have upvotes field
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to upvote answer" });
    }
  });

  // ============= Notifications =============
  app.get("/api/notifications", verifyFirebaseToken, async (req, res) => {
    try {
      const user = req.user as any;
      const notifications = await storage.getNotificationsByUser(user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", verifyFirebaseToken, async (req, res) => {
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
