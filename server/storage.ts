import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import {
  type User,
  type InsertUser,
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
  users,
  lessons,
  quizzes,
  quizSubmissions,
  mentorshipSessions,
  studentProgress,
  studentBadges,
  userNotifications,
  auditLogs,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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

  constructor(connectionString: string) {
    const pool = new Pool({ connectionString });
    this.db = drizzle(pool);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getUsersByRole(role: User["role"]): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, role));
  }

  // Lesson operations
  async getAllLessons(filters?: { gradeLevel?: number; subject?: string }): Promise<Lesson[]> {
    let query = this.db.select().from(lessons);
    
    if (filters?.gradeLevel) {
      query = query.where(eq(lessons.gradeLevel, filters.gradeLevel)) as any;
    }
    if (filters?.subject) {
      const condition = filters.gradeLevel 
        ? and(eq(lessons.gradeLevel, filters.gradeLevel), eq(lessons.subject, filters.subject))
        : eq(lessons.subject, filters.subject);
      query = this.db.select().from(lessons).where(condition!) as any;
    }

    return await query.orderBy(asc(lessons.sequence));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const result = await this.db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    return result[0];
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

    return await query.orderBy(desc(auditLogs.timestamp));
  }
}

// Initialize storage with DATABASE_URL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const storage = new PostgresStorage(connectionString);
