import { z } from 'zod';

export const CourseSyllabusSchema = z
  .object({
    schedule: z.string().optional(),
    topics: z.array(z.string()).optional(),
    policies: z.string().optional(),
  })
  .passthrough();

export const TrackingCourseDetailSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  termLabel: z.string().min(1),
  courseCode: z.string().min(1),
  isActive: z.boolean(),
  description: z.string().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  syllabusJson: CourseSyllabusSchema.nullable().optional(),
  sequentialVideos: z.boolean().optional(),
  videoProgressPercent: z.number().min(0).max(100).optional(),
  assignmentCount: z.number().int().nonnegative().optional(),
  publishedAssignmentCount: z.number().int().nonnegative().optional(),
  videoCount: z.number().int().nonnegative().optional(),
  projectCount: z.number().int().nonnegative().optional(),
});

export const UpdateCourseProfileRequestSchema = z.object({
  title: z.string().min(1).optional(),
  termLabel: z.string().min(1).optional(),
  courseCode: z.string().min(1).optional(),
  description: z.string().max(50000).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  syllabusJson: CourseSyllabusSchema.nullable().optional(),
  sequentialVideos: z.boolean().optional(),
});

export const CourseGradesRollupSchema = z.object({
  courseId: z.string().min(1),
  projects: z.array(
    z.object({
      projectId: z.string().min(1),
      projectKey: z.string(),
      title: z.string(),
      status: z.string(),
      score: z.number().nullable().optional(),
      maxScore: z.number().nullable().optional(),
    })
  ),
  assignments: z.array(
    z.object({
      assignmentId: z.string().min(1),
      title: z.string(),
      status: z.string(),
      score: z.number().nullable().optional(),
      pointsPossible: z.number(),
    })
  ),
});

export const VideoAnalyticsItemSchema = z.object({
  videoId: z.string().min(1),
  title: z.string(),
  sectionTitle: z.string(),
  enrolledCount: z.number().int().nonnegative(),
  watchedCount: z.number().int().nonnegative(),
  avgWatchedProgress: z.number().min(0).max(1),
});

export const VideoAnalyticsResponseSchema = z.object({
  videos: z.array(VideoAnalyticsItemSchema),
});

export type TrackingCourseDetail = z.infer<typeof TrackingCourseDetailSchema>;
export type CourseGradesRollup = z.infer<typeof CourseGradesRollupSchema>;
