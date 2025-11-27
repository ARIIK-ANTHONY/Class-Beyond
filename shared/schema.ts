import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", [
  "student",
  "teacher",
  "mentor",
  "admin",
]);

// User storage table (extended for ClassBeyond)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("student"),
  googleCalendarToken: text("google_calendar_token"), // Encrypted access token
  googleCalendarRefreshToken: text("google_calendar_refresh_token"), // Encrypted refresh token
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Parent-Student relationship (parents can monitor multiple children)
export const parentStudents = pgTable("parent_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ParentStudent = typeof parentStudents.$inferSelect;

// Subject enum
export const subjectEnum = pgEnum("subject", ["math", "english", "science"]);

// Lessons table
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  subject: subjectEnum("subject").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(), // Rich text content
  level: varchar("level", { length: 50 }).notNull(), // e.g., "beginner", "intermediate", "advanced"
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  externalContent: jsonb("external_content"), // Array of external videos, books, courses
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Quiz questions table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  title: varchar("title", { length: 255 }).notNull(),
  questions: jsonb("questions").notNull(), // Array of {question, options, correctAnswer}
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Student progress tracking
export const studentProgress = pgTable("student_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  completed: boolean("completed").default(false),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertStudentProgressSchema = createInsertSchema(studentProgress).omit({
  id: true,
  lastAccessedAt: true,
});

export type InsertStudentProgress = z.infer<typeof insertStudentProgressSchema>;
export type StudentProgress = typeof studentProgress.$inferSelect;

// Quiz submissions
export const quizSubmissions = pgTable("quiz_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: jsonb("answers").notNull(), // Array of student answers
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertQuizSubmissionSchema = createInsertSchema(quizSubmissions).omit({
  id: true,
  submittedAt: true,
});

export type InsertQuizSubmission = z.infer<typeof insertQuizSubmissionSchema>;
export type QuizSubmission = typeof quizSubmissions.$inferSelect;

// Badge types enum
export const badgeTypeEnum = pgEnum("badge_type", [
  "first_lesson",
  "quiz_master",
  "perfect_score",
  "week_streak",
  "subject_champion",
  "curious_learner",
]);

// Badges earned by students
export const studentBadges = pgTable("student_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  badgeType: badgeTypeEnum("badge_type").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  metadata: jsonb("metadata"), // Additional info about how badge was earned
});

export const insertStudentBadgeSchema = createInsertSchema(studentBadges).omit({
  id: true,
  earnedAt: true,
});

export type InsertStudentBadge = z.infer<typeof insertStudentBadgeSchema>;
export type StudentBadge = typeof studentBadges.$inferSelect;

// Mentorship session status enum
export const sessionStatusEnum = pgEnum("session_status", [
  "requested",
  "pending",
  "approved",
  "scheduled",
  "completed",
  "cancelled",
]);

// Mentorship sessions
export const mentorshipSessions = pgTable("mentorship_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  mentorId: varchar("mentor_id").references(() => users.id), // Nullable until mentor accepts
  subject: subjectEnum("subject").notNull(),
  requestMessage: text("request_message"),
  scheduledAt: timestamp("scheduled_at"),
  status: sessionStatusEnum("status").notNull().default("requested"),
  googleCalendarEventId: varchar("google_calendar_event_id"), // Store calendar event ID
  meetingLink: text("meeting_link"), // Google Meet or Zoom link
  duration: integer("duration").default(60), // Session duration in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMentorshipSessionSchema = createInsertSchema(mentorshipSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMentorshipSession = z.infer<typeof insertMentorshipSessionSchema>;
export type MentorshipSession = typeof mentorshipSessions.$inferSelect;

// Mentor profiles (extended profile information for mentors)
export const mentorProfiles = pgTable("mentor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").notNull().unique().references(() => users.id),
  bio: text("bio"), // Mentor's bio/introduction
  expertise: jsonb("expertise"), // Array of subjects/topics they specialize in
  experience: text("experience"), // Years/description of experience
  education: text("education"), // Educational background
  availability: jsonb("availability"), // Available time slots { day: string, slots: [{start, end}] }
  hourlyRate: integer("hourly_rate"), // Optional: if mentoring is paid
  totalSessions: integer("total_sessions").default(0),
  averageRating: integer("average_rating").default(0), // Stored as integer (e.g., 450 = 4.5 stars)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMentorProfile = z.infer<typeof insertMentorProfileSchema>;
export type MentorProfile = typeof mentorProfiles.$inferSelect;

// Mentor reviews/ratings
export const mentorReviews = pgTable("mentor_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").notNull().references(() => users.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  sessionId: varchar("session_id").references(() => mentorshipSessions.id),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"), // Optional written review
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMentorReviewSchema = createInsertSchema(mentorReviews).omit({
  id: true,
  createdAt: true,
});

export type InsertMentorReview = z.infer<typeof insertMentorReviewSchema>;
export type MentorReview = typeof mentorReviews.$inferSelect;

// Q&A Forum for peer learning
export const forumQuestions = pgTable("forum_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  subject: subjectEnum("subject").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForumQuestionSchema = createInsertSchema(forumQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertForumQuestion = z.infer<typeof insertForumQuestionSchema>;
export type ForumQuestion = typeof forumQuestions.$inferSelect;

// Forum answers
export const forumAnswers = pgTable("forum_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => forumQuestions.id),
  userId: varchar("user_id").notNull().references(() => users.id), // Can be student, teacher, or mentor
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForumAnswerSchema = createInsertSchema(forumAnswers).omit({
  id: true,
  createdAt: true,
});

export type InsertForumAnswer = z.infer<typeof insertForumAnswerSchema>;
export type ForumAnswer = typeof forumAnswers.$inferSelect;

// Audit log for tracking user actions (NFR09)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// Notifications table
export const notificationTypeEnum = pgEnum("notification_type", [
  "mentorship_request",
  "mentorship_approved",
  "mentorship_scheduled",
  "badge_earned",
  "lesson_available",
  "quiz_reminder",
  "forum_answer",
]);

export const userNotifications = pgTable("user_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // ID of related entity (lesson, quiz, etc.)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof userNotifications.$inferSelect;
