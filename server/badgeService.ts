import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { badges, studentBadges, studentProgress, quizSubmissions, quizzes as quizzesTable } from "@shared/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { BADGE_DEFINITIONS } from "./badgeDefinitions";

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Initialize badges in database if they don't exist
export async function initializeBadges() {
  try {
    const existingBadges = await db.select().from(badges);
    
    if (existingBadges.length === 0) {
      console.log("Initializing badges...");
      await db.insert(badges).values(BADGE_DEFINITIONS);
      console.log(`Initialized ${BADGE_DEFINITIONS.length} badges`);
    }
  } catch (error) {
    console.error("Error initializing badges:", error);
  }
}

// Get all badges for a student with their progress
export async function getStudentBadges(studentId: string) {
  try {
    const allBadges = await db.select().from(badges);
    
    const earnedBadgesData = await db
      .select()
      .from(studentBadges)
      .where(eq(studentBadges.studentId, studentId));

    // Create a map of badge progress
    const badgeProgressMap = new Map(
      earnedBadgesData.map((sb) => [sb.badgeId, sb])
    );

    // Combine all badges with student progress
    const result = allBadges.map((badge) => {
      const studentBadge = badgeProgressMap.get(badge.id);
      return {
        ...badge,
        progress: studentBadge?.progress || 0,
        earnedAt: studentBadge?.earnedAt,
        isEarned: !!studentBadge?.earnedAt,
      };
    });

    return result;
  } catch (error) {
    console.error("Error getting student badges:", error);
    return [];
  }
}

// Check and award badges after a quiz submission
export async function checkAndAwardBadgesForQuiz(
  studentId: string,
  quizId: string,
  score: number,
  totalQuestions: number,
  completionTime: number // in seconds
) {
  const newlyEarnedBadges: any[] = [];

  try {
    // Get all badges
    const allBadges = await db.select().from(badges);

    // Get student's quiz stats
    const quizStats = await db
      .select({
        totalQuizzes: count(),
        perfectScores: sql<number>`COUNT(CASE WHEN score = total_questions THEN 1 END)`,
      })
      .from(quizSubmissions)
      .where(eq(quizSubmissions.studentId, studentId));

    const stats = quizStats[0] || { totalQuizzes: 0, perfectScores: 0 };
    const percentageScore = (score / totalQuestions) * 100;
    const isPerfectScore = score === totalQuestions;

    // Check quiz count badges
    await checkProgressBadge(
      studentId,
      allBadges,
      "quiz_count",
      stats.totalQuizzes,
      newlyEarnedBadges
    );

    // Check perfect score badges
    if (isPerfectScore) {
      await checkProgressBadge(
        studentId,
        allBadges,
        "perfect_score",
        stats.perfectScores,
        newlyEarnedBadges
      );
    }

    // Check speed demon badge
    if (isPerfectScore && completionTime <= 120) {
      await checkAndAwardBadge(
        studentId,
        allBadges.find((b) => b.name === "Speed Demon"),
        newlyEarnedBadges
      );
    }

    // Check time-based badges (Night Owl, Early Bird)
    const currentHour = new Date().getHours();
    await checkTimeBadges(studentId, allBadges, currentHour, newlyEarnedBadges);

    // Check weekend badge
    const isWeekend = [0, 6].includes(new Date().getDay());
    if (isWeekend) {
      await checkWeekendBadge(studentId, allBadges, newlyEarnedBadges);
    }

    // Check subject mastery badges
    // Get quiz subject first
    const quizResult = await db
      .select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .limit(1);

    const quiz = quizResult[0];

    if (quiz && percentageScore >= 80) {
      await checkSubjectMasteryBadge(
        studentId,
        allBadges,
        quiz.subject,
        percentageScore,
        newlyEarnedBadges
      );
    }

    return newlyEarnedBadges;
  } catch (error) {
    console.error("Error checking badges:", error);
    return [];
  }
}

// Helper: Check and award a progress-based badge
async function checkProgressBadge(
  studentId: string,
  allBadges: any[],
  requirementType: string,
  currentValue: number,
  newlyEarnedBadges: any[]
) {
  const relevantBadges = allBadges.filter(
    (b) => b.requirement.type === requirementType
  );

  for (const badge of relevantBadges) {
    const requiredValue = badge.requirement.value;

    // Check if already earned
    const existing = await db
      .select()
      .from(studentBadges)
      .where(
        and(
          eq(studentBadges.studentId, studentId),
          eq(studentBadges.badgeId, badge.id)
        )
      );

    if (existing.length > 0 && existing[0].earnedAt) {
      // Already earned, just update progress
      await db
        .update(studentBadges)
        .set({ progress: currentValue })
        .where(eq(studentBadges.id, existing[0].id));
      continue;
    }

    // Update or create progress
    if (existing.length > 0) {
      await db
        .update(studentBadges)
        .set({
          progress: currentValue,
          earnedAt: currentValue >= requiredValue ? new Date() : null,
        })
        .where(eq(studentBadges.id, existing[0].id));

      if (currentValue >= requiredValue) {
        newlyEarnedBadges.push(badge);
      }
    } else {
      // Create new entry
      await db.insert(studentBadges).values({
        studentId,
        badgeId: badge.id,
        progress: currentValue,
        earnedAt: currentValue >= requiredValue ? new Date() : null,
      });

      if (currentValue >= requiredValue) {
        newlyEarnedBadges.push(badge);
      }
    }
  }
}

// Helper: Check and award a specific badge
async function checkAndAwardBadge(
  studentId: string,
  badge: any | undefined,
  newlyEarnedBadges: any[]
) {
  if (!badge) return;

  const existing = await db
    .select()
    .from(studentBadges)
    .where(
      and(
        eq(studentBadges.studentId, studentId),
        eq(studentBadges.badgeId, badge.id)
      )
    );

  if (existing.length === 0) {
    await db.insert(studentBadges).values({
      studentId,
      badgeId: badge.id,
      progress: badge.requirement.value,
      earnedAt: new Date(),
    });
    newlyEarnedBadges.push(badge);
  } else if (!existing[0].earnedAt) {
    await db
      .update(studentBadges)
      .set({
        earnedAt: new Date(),
        progress: badge.requirement.value,
      })
      .where(eq(studentBadges.id, existing[0].id));
    newlyEarnedBadges.push(badge);
  }
}

// Helper: Check time-based badges
async function checkTimeBadges(
  studentId: string,
  allBadges: any[],
  currentHour: number,
  newlyEarnedBadges: any[]
) {
  const timeBadges = allBadges.filter(
    (b) => b.requirement.type === "time_based"
  );

  for (const badge of timeBadges) {
    const { startHour, endHour } = badge.requirement;
    let isInTimeRange = false;

    if (startHour > endHour) {
      // Crosses midnight (e.g., 21-6)
      isInTimeRange = currentHour >= startHour || currentHour < endHour;
    } else {
      // Normal range (e.g., 5-8)
      isInTimeRange = currentHour >= startHour && currentHour < endHour;
    }

    if (isInTimeRange) {
      // Get existing progress
      const existing = await db
        .select()
        .from(studentBadges)
        .where(
          and(
            eq(studentBadges.studentId, studentId),
            eq(studentBadges.badgeId, badge.id)
          )
        );

      const currentProgress = existing[0]?.progress || 0;
      const newProgress = currentProgress + 1;
      const requiredValue = badge.requirement.value;

      if (existing.length > 0) {
        await db
          .update(studentBadges)
          .set({
            progress: newProgress,
            earnedAt: newProgress >= requiredValue ? new Date() : existing[0].earnedAt,
          })
          .where(eq(studentBadges.id, existing[0].id));

        if (newProgress >= requiredValue && !existing[0].earnedAt) {
          newlyEarnedBadges.push(badge);
        }
      } else {
        await db.insert(studentBadges).values({
          studentId,
          badgeId: badge.id,
          progress: newProgress,
          earnedAt: newProgress >= requiredValue ? new Date() : null,
        });

        if (newProgress >= requiredValue) {
          newlyEarnedBadges.push(badge);
        }
      }
    }
  }
}

// Helper: Check weekend warrior badge
async function checkWeekendBadge(
  studentId: string,
  allBadges: any[],
  newlyEarnedBadges: any[]
) {
  const weekendBadge = allBadges.find(
    (b) => b.requirement.type === "weekend_activity"
  );

  if (weekendBadge) {
    const existing = await db
      .select()
      .from(studentBadges)
      .where(
        and(
          eq(studentBadges.studentId, studentId),
          eq(studentBadges.badgeId, weekendBadge.id)
        )
      );

    const currentProgress = existing[0]?.progress || 0;
    const newProgress = currentProgress + 1;
    const requiredValue = weekendBadge.requirement.value;

    if (existing.length > 0) {
      await db
        .update(studentBadges)
        .set({
          progress: newProgress,
          earnedAt: newProgress >= requiredValue ? new Date() : existing[0].earnedAt,
        })
        .where(eq(studentBadges.id, existing[0].id));

      if (newProgress >= requiredValue && !existing[0].earnedAt) {
        newlyEarnedBadges.push(weekendBadge);
      }
    } else {
      await db.insert(studentBadges).values({
        studentId,
        badgeId: weekendBadge.id,
        progress: newProgress,
        earnedAt: newProgress >= requiredValue ? new Date() : null,
      });

      if (newProgress >= requiredValue) {
        newlyEarnedBadges.push(weekendBadge);
      }
    }
  }
}

// Helper: Check subject mastery badges
async function checkSubjectMasteryBadge(
  studentId: string,
  allBadges: any[],
  subject: string,
  score: number,
  newlyEarnedBadges: any[]
) {
  const masteryBadges = allBadges.filter(
    (b) =>
      b.requirement.type === "subject_mastery" &&
      b.requirement.subject === subject
  );

  for (const badge of masteryBadges) {
    const minScore = badge.requirement.minScore || 0;

    if (score >= minScore) {
      const existing = await db
        .select()
        .from(studentBadges)
        .where(
          and(
            eq(studentBadges.studentId, studentId),
            eq(studentBadges.badgeId, badge.id)
          )
        );

      const currentProgress = existing[0]?.progress || 0;
      const newProgress = currentProgress + 1;
      const requiredValue = badge.requirement.value;

      if (existing.length > 0) {
        await db
          .update(studentBadges)
          .set({
            progress: newProgress,
            earnedAt: newProgress >= requiredValue ? new Date() : existing[0].earnedAt,
          })
          .where(eq(studentBadges.id, existing[0].id));

        if (newProgress >= requiredValue && !existing[0].earnedAt) {
          newlyEarnedBadges.push(badge);
        }
      } else {
        await db.insert(studentBadges).values({
          studentId,
          badgeId: badge.id,
          progress: newProgress,
          earnedAt: newProgress >= requiredValue ? new Date() : null,
        });

        if (newProgress >= requiredValue) {
          newlyEarnedBadges.push(badge);
        }
      }
    }
  }
}

// Check lesson completion badges
export async function checkLessonBadges(studentId: string) {
  const newlyEarnedBadges: any[] = [];

  try {
    const allBadges = await db.select().from(badges);

    // Get total lessons completed
    const lessonStats = await db
      .select({
        totalLessons: count(),
      })
      .from(studentProgress)
      .where(
        and(
          eq(studentProgress.studentId, studentId),
          eq(studentProgress.completed, true)
        )
      );

    const totalLessons = lessonStats[0]?.totalLessons || 0;

    await checkProgressBadge(
      studentId,
      allBadges,
      "lesson_count",
      totalLessons,
      newlyEarnedBadges
    );

    return newlyEarnedBadges;
  } catch (error) {
    console.error("Error checking lesson badges:", error);
    return [];
  }
}
