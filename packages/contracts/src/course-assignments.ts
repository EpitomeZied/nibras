import { z } from 'zod';

export const AssignmentDisplayStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'submitted',
  'graded',
  'late',
]);

export const AssignmentResourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
});

export const CourseAssignmentSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  pointsPossible: z.number().int().nonnegative(),
  sortOrder: z.number().int().nonnegative(),
  published: z.boolean(),
  status: AssignmentDisplayStatusSchema.optional(),
  score: z.number().optional(),
});

export const CourseAssignmentDetailSchema = CourseAssignmentSchema.extend({
  resources: z.array(AssignmentResourceSchema).optional(),
  rubric: z
    .array(
      z.object({
        criterion: z.string(),
        weight: z.number(),
        description: z.string().optional(),
      })
    )
    .optional(),
  feedback: z.string().optional(),
});

export const CreateCourseAssignmentRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  content: z.string().max(50000).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  pointsPossible: z.number().int().positive().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  published: z.boolean().optional(),
});

export const UpdateCourseAssignmentRequestSchema = CreateCourseAssignmentRequestSchema.partial();

export const SubmitAssignmentRequestSchema = z.object({
  content: z.string().min(1),
  resources: z.array(AssignmentResourceSchema).optional(),
});

export const GradeAssignmentRequestSchema = z.object({
  userId: z.string().min(1),
  score: z.number().min(0),
  feedback: z.string().max(10000).optional(),
});

export const AssignmentSubmissionResponseSchema = z.object({
  id: z.string().min(1),
  assignmentId: z.string().min(1),
  submittedAt: z.string().datetime(),
  status: AssignmentDisplayStatusSchema,
  score: z.number().optional(),
  feedback: z.string().optional(),
});

export const AssignmentSubmissionQueueItemSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  username: z.string().optional(),
  displayName: z.string().optional(),
  submittedAt: z.string().datetime().nullable(),
  status: AssignmentDisplayStatusSchema,
  score: z.number().optional(),
  contentPreview: z.string().optional(),
});

export const AssignmentSubmissionsListSchema = z.object({
  items: z.array(AssignmentSubmissionQueueItemSchema),
});

export type CourseAssignment = z.infer<typeof CourseAssignmentSchema>;
export type CourseAssignmentDetail = z.infer<typeof CourseAssignmentDetailSchema>;
export type AssignmentDisplayStatus = z.infer<typeof AssignmentDisplayStatusSchema>;
export type CreateCourseAssignmentRequest = z.infer<typeof CreateCourseAssignmentRequestSchema>;
export type UpdateCourseAssignmentRequest = z.infer<typeof UpdateCourseAssignmentRequestSchema>;
export type SubmitAssignmentRequest = z.infer<typeof SubmitAssignmentRequestSchema>;
export type GradeAssignmentRequest = z.infer<typeof GradeAssignmentRequestSchema>;
export type AssignmentSubmissionResponse = z.infer<typeof AssignmentSubmissionResponseSchema>;
export type AssignmentSubmissionQueueItem = z.infer<typeof AssignmentSubmissionQueueItemSchema>;
export type AssignmentSubmissionsList = z.infer<typeof AssignmentSubmissionsListSchema>;
