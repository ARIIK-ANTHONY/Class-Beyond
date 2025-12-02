import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import {
  type User,
  type UpsertUser,
  type Lesson,
  type InsertLesson,
  type Quiz,
  type InsertQuiz,
  type QuizSubmission,
  type InsertQuizSubmission,
  type MentorshipSession,
  type InsertMentorshipSession,
  type StudentProgress,
  type InsertStudentProgress,
  type StudentBadge,
  type InsertStudentBadge,
  type Notification,
  type InsertNotification,
  type AuditLog,
  type MentorProfile,
  type InsertMentorProfile,
  type MentorReview,
  type InsertMentorReview,
  type ForumQuestion,
  type InsertForumQuestion,
  type ForumAnswer,
  type InsertForumAnswer,
  users,
  lessons,
  quizzes,
  quizSubmissions,
  mentorshipSessions,
  studentProgress,
  studentBadges,
  userNotifications,
  auditLogs,
  mentorProfiles,
  mentorReviews,
  forumQuestions,
  forumAnswers,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getUsersByRole(role: User["role"]): Promise<User[]>;

  // Lesson operations
  getAllLessons(filters?: { gradeLevel?: number; subject?: string }): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<boolean>;

  // Quiz operations
  getQuizzesByLesson(lessonId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;

  // Quiz submission operations
  createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission>;
  getQuizSubmissionsByStudent(studentId: string): Promise<QuizSubmission[]>;
  getQuizSubmissionsByQuiz(quizId: string): Promise<QuizSubmission[]>;

  // Mentorship operations
  createMentorshipSession(session: InsertMentorshipSession): Promise<MentorshipSession>;
  getMentorshipSessionsByStudent(studentId: string): Promise<MentorshipSession[]>;
  getMentorshipSessionsByMentor(mentorId: string): Promise<MentorshipSession[]>;
  updateMentorshipSession(id: string, updates: Partial<MentorshipSession>): Promise<MentorshipSession | undefined>;
  getPendingMentorshipRequests(): Promise<MentorshipSession[]>;

  // Mentor profile operations
  createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile>;
  getMentorProfile(mentorId: string): Promise<MentorProfile | undefined>;
  updateMentorProfile(mentorId: string, updates: Partial<MentorProfile>): Promise<MentorProfile | undefined>;
  getAllMentorProfiles(): Promise<MentorProfile[]>;

  // Mentor review operations
  createMentorReview(review: InsertMentorReview): Promise<MentorReview>;
  getReviewsByMentor(mentorId: string): Promise<MentorReview[]>;
  getReviewsByStudent(studentId: string): Promise<MentorReview[]>;

  // Progress operations
  getUserProgress(userId: string, lessonId: string): Promise<StudentProgress | undefined>;
  createOrUpdateProgress(progress: InsertStudentProgress): Promise<StudentProgress>;
  getProgressByUser(userId: string): Promise<StudentProgress[]>;

  // Badge operations
  createBadge(badge: InsertStudentBadge): Promise<StudentBadge>;
  getBadgesByUser(userId: string): Promise<StudentBadge[]>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<boolean>;

  // Audit log operations
  createAuditLog(log: Partial<AuditLog>): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; action?: string }): Promise<AuditLog[]>;
}

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  public forumQuestions = forumQuestions;
  public forumAnswers = forumAnswers;

  constructor(connectionString: string) {
    this.pool = new Pool({ 
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000, // Increase idle timeout to 30 seconds
      connectionTimeoutMillis: 10000, // Add connection timeout
    });
    
    // Handle pool errors gracefully
    this.pool.on('error', (err) => {
      console.error('❌ Database pool error:', err.message);
    });
    
    this.db = drizzle(this.pool);
  }

  // Helper method to execute queries with retry logic
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    operationName: string = 'database operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const isConnectionError = error.message?.includes('Connection terminated') || 
                                 error.message?.includes('connection') ||
                                 error.code === 'PROTOCOL_CONNECTION_LOST';
        
        if (isConnectionError && attempt < maxRetries) {
          console.warn(`⚠️ ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`, error.message);
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
        
        console.error(`❌ ${operationName} failed:`, error.message);
        throw error;
      }
    }
    
    throw lastError!;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    }, 2, 'getUser');
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Username field doesn't exist in current schema - using email instead
    return await this.getUserByEmail(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    }, 2, 'getUserByEmail');
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    }, 2, 'getUserById');
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    return this.executeWithRetry(async () => {
      const result = await this.db.insert(users).values(insertUser).returning();
      return result[0];
    }, 2, 'createUser');
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0];
    }, 2, 'updateUser');
  }

  async getUsersByRole(role: User["role"]): Promise<User[]> {
    return this.executeWithRetry(async () => {
      return await this.db.select().from(users).where(eq(users.role, role));
    }, 2, 'getUsersByRole');
  }

  // Lesson operations
  async getAllLessons(filters?: { gradeLevel?: number; subject?: string }): Promise<Lesson[]> {
    return this.executeWithRetry(async () => {
      // Return ALL lessons, not just approved ones - let the caller filter by approval status
      let query = this.db.select().from(lessons);
      // Note: gradeLevel field doesn't exist in current schema, only filtering by subject
      if (filters?.subject) {
        query = this.db.select().from(lessons).where(eq(lessons.subject, filters.subject as any)) as any;
      }
      return await query.orderBy(desc(lessons.createdAt));
    }, 2, 'getAllLessons');
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    return this.executeWithRetry(async () => {
      const result = await this.db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
      return result[0];
    }, 2, 'getLesson');
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const result = await this.db.insert(lessons).values(lesson).returning();
    return result[0];
  }

  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | undefined> {
    const result = await this.db.update(lessons).set(updates).where(eq(lessons.id, id)).returning();
    return result[0];
  }

  async deleteLesson(id: string): Promise<boolean> {
    // First, delete any quizzes associated with this lesson
    await this.db.delete(quizzes).where(eq(quizzes.lessonId, id));
    
    // Then delete the lesson itself
    const result = await this.db.delete(lessons).where(eq(lessons.id, id)).returning();
    return result.length > 0;
  }

  // Quiz operations
  async getQuizzesByLesson(lessonId: string): Promise<Quiz[]> {
    return await this.db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const result = await this.db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    return result[0];
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const result = await this.db.insert(quizzes).values(quiz).returning();
    return result[0];
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined> {
    const result = await this.db.update(quizzes).set(updates).where(eq(quizzes.id, id)).returning();
    return result[0];
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const result = await this.db.delete(quizzes).where(eq(quizzes.id, id)).returning();
    return result.length > 0;
  }

  // Quiz submission operations
  async createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission> {
    const result = await this.db.insert(quizSubmissions).values(submission).returning();
    return result[0];
  }

  async getQuizSubmissionsByStudent(studentId: string): Promise<QuizSubmission[]> {
    return await this.db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.studentId, studentId))
      .orderBy(desc(quizSubmissions.submittedAt));
  }

  async getQuizSubmissionsByQuiz(quizId: string): Promise<QuizSubmission[]> {
    return await this.db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.quizId, quizId))
      .orderBy(desc(quizSubmissions.submittedAt));
  }

  // Mentorship operations
  async createMentorshipSession(session: InsertMentorshipSession): Promise<MentorshipSession> {
    const result = await this.db.insert(mentorshipSessions).values(session).returning();
    return result[0];
  }

  async getMentorshipSessionsByStudent(studentId: string): Promise<MentorshipSession[]> {
    return await this.db
      .select()
      .from(mentorshipSessions)
      .where(eq(mentorshipSessions.studentId, studentId))
      .orderBy(desc(mentorshipSessions.createdAt));
  }

  async getMentorshipSessionsByMentor(mentorId: string): Promise<MentorshipSession[]> {
    return await this.db
      .select()
      .from(mentorshipSessions)
      .where(eq(mentorshipSessions.mentorId, mentorId))
      .orderBy(desc(mentorshipSessions.createdAt));
  }

  async updateMentorshipSession(id: string, updates: Partial<MentorshipSession>): Promise<MentorshipSession | undefined> {
    const result = await this.db
      .update(mentorshipSessions)
      .set(updates)
      .where(eq(mentorshipSessions.id, id))
      .returning();
    return result[0];
  }

  async getPendingMentorshipRequests(): Promise<MentorshipSession[]> {
    return await this.db
      .select()
      .from(mentorshipSessions)
      .where(eq(mentorshipSessions.status, "pending"))
      .orderBy(desc(mentorshipSessions.createdAt));
  }

  // Progress operations
  async getUserProgress(userId: string, lessonId: string): Promise<StudentProgress | undefined> {
    const result = await this.db
      .select()
      .from(studentProgress)
      .where(and(eq(studentProgress.studentId, userId), eq(studentProgress.lessonId, lessonId)))
      .limit(1);
    return result[0];
  }

  async createOrUpdateProgress(progress: InsertStudentProgress): Promise<StudentProgress> {
    const existing = await this.getUserProgress(progress.studentId, progress.lessonId);
    
    if (existing) {
      const result = await this.db
        .update(studentProgress)
        .set({ ...progress, lastAccessedAt: new Date() })
        .where(and(eq(studentProgress.studentId, progress.studentId), eq(studentProgress.lessonId, progress.lessonId)))
        .returning();
      return result[0];
    } else {
      const result = await this.db.insert(studentProgress).values(progress).returning();
      return result[0];
    }
  }

  async getProgressByUser(userId: string): Promise<StudentProgress[]> {
    return await this.db
      .select()
      .from(studentProgress)
      .where(eq(studentProgress.studentId, userId))
      .orderBy(desc(studentProgress.lastAccessedAt));
  }

  // Badge operations
  async createBadge(badge: InsertStudentBadge): Promise<StudentBadge> {
    const result = await this.db.insert(studentBadges).values(badge).returning();
    return result[0];
  }

  async getBadgesByUser(userId: string): Promise<StudentBadge[]> {
    return await this.db
      .select()
      .from(studentBadges)
      .where(eq(studentBadges.studentId, userId))
      .orderBy(desc(studentBadges.earnedAt));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await this.db.insert(userNotifications).values(notification).returning();
    return result[0];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await this.db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await this.db
      .update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.id, id))
      .returning();
    return result.length > 0;
  }

  // Audit log operations
  async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
    const result = await this.db.insert(auditLogs).values(log as any).returning();
    return result[0];
  }

  async getAuditLogs(filters?: { userId?: string; action?: string }): Promise<AuditLog[]> {
    let query = this.db.select().from(auditLogs);
    
    if (filters?.userId) {
      query = query.where(eq(auditLogs.userId, filters.userId)) as any;
    }
    if (filters?.action) {
      const condition = filters.userId
        ? and(eq(auditLogs.userId, filters.userId), eq(auditLogs.action, filters.action))
        : eq(auditLogs.action, filters.action);
      query = this.db.select().from(auditLogs).where(condition!) as any;
    }

    return await query.orderBy(desc(auditLogs.createdAt));
  }

  // Mentor profile operations
  async createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile> {
    const result = await this.db.insert(mentorProfiles).values(profile).returning();
    return result[0];
  }

  async getMentorProfile(mentorId: string): Promise<MentorProfile | undefined> {
    const result = await this.db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.mentorId, mentorId))
      .limit(1);
    return result[0];
  }

  async updateMentorProfile(mentorId: string, updates: Partial<MentorProfile>): Promise<MentorProfile | undefined> {
    const result = await this.db
      .update(mentorProfiles)
      .set(updates)
      .where(eq(mentorProfiles.mentorId, mentorId))
      .returning();
    return result[0];
  }

  async getAllMentorProfiles(): Promise<MentorProfile[]> {
    return await this.db
      .select()
      .from(mentorProfiles)
      .where(eq(mentorProfiles.isActive, true))
      .orderBy(desc(mentorProfiles.averageRating));
  }

  // Mentor review operations
  async createMentorReview(review: InsertMentorReview): Promise<MentorReview> {
    const result = await this.db.insert(mentorReviews).values(review).returning();
    
    // Update mentor's average rating
    const reviews = await this.getReviewsByMentor(review.mentorId);
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / reviews.length) * 100); // Store as integer (e.g., 450 = 4.5)
    
    await this.db
      .update(mentorProfiles)
      .set({ averageRating: avgRating })
      .where(eq(mentorProfiles.mentorId, review.mentorId));
    
    return result[0];
  }

  async getReviewsByMentor(mentorId: string): Promise<MentorReview[]> {
    return await this.db
      .select()
      .from(mentorReviews)
      .where(eq(mentorReviews.mentorId, mentorId))
      .orderBy(desc(mentorReviews.createdAt));
  }

  async getReviewsByStudent(studentId: string): Promise<MentorReview[]> {
    return await this.db
      .select()
      .from(mentorReviews)
      .where(eq(mentorReviews.studentId, studentId))
      .orderBy(desc(mentorReviews.createdAt));
  }
}

// Initialize storage with DATABASE_URL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const storage = new PostgresStorage(connectionString);
