import { z } from 'zod';

export const VideoProviderSchema = z.enum(['youtube', 'bilibili', 'mp4', 'url']);

export const CourseVideoSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  sectionId: z.string().min(1),
  sectionTitle: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  provider: VideoProviderSchema,
  externalId: z.string().nullable().optional(),
  embedUrl: z.string().nullable().optional(),
  playbackUrl: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().nonnegative(),
  watched: z.boolean().optional(),
  watchedProgress: z.number().min(0).max(1).optional(),
  locked: z.boolean().optional(),
  requiresVideoId: z.string().nullable().optional(),
  linkedProjectId: z.string().nullable().optional(),
  linkedMilestoneId: z.string().nullable().optional(),
  linkedProjectTitle: z.string().optional(),
});

export const CourseSectionSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().nonnegative(),
  videos: z.array(CourseVideoSchema),
});

export const CourseSectionsResponseSchema = z.object({
  sections: z.array(CourseSectionSchema),
});

export const CreateCourseSectionRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const UpdateCourseSectionRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const CreateCourseVideoRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  provider: VideoProviderSchema,
  externalId: z.string().max(200).optional(),
  embedUrl: z.string().url().max(2000).optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  requiresVideoId: z.string().optional(),
  linkedProjectId: z.string().optional(),
  linkedMilestoneId: z.string().optional(),
});

export const UpdateCourseVideoRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  provider: VideoProviderSchema.optional(),
  externalId: z.string().max(200).nullable().optional(),
  embedUrl: z.string().url().max(2000).nullable().optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  sectionId: z.string().min(1).optional(),
  requiresVideoId: z.string().nullable().optional(),
  linkedProjectId: z.string().nullable().optional(),
  linkedMilestoneId: z.string().nullable().optional(),
});

export const VideoProgressRequestSchema = z.object({
  watched: z.boolean().optional(),
  watchedProgress: z.number().min(0).max(1).optional(),
});

export const VideoProgressResponseSchema = z.object({
  watched: z.boolean(),
  watchedProgress: z.number().min(0).max(1),
});

export type CourseVideo = z.infer<typeof CourseVideoSchema>;
export type CourseSection = z.infer<typeof CourseSectionSchema>;
export type CreateCourseSectionRequest = z.infer<typeof CreateCourseSectionRequestSchema>;
export type UpdateCourseSectionRequest = z.infer<typeof UpdateCourseSectionRequestSchema>;
export type CreateCourseVideoRequest = z.infer<typeof CreateCourseVideoRequestSchema>;
export type UpdateCourseVideoRequest = z.infer<typeof UpdateCourseVideoRequestSchema>;
export type VideoProgressRequest = z.infer<typeof VideoProgressRequestSchema>;
export type VideoProgressResponse = z.infer<typeof VideoProgressResponseSchema>;
export type VideoProvider = z.infer<typeof VideoProviderSchema>;
