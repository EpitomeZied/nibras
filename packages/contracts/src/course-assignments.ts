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

export const CourseAssignmentTypeSchema = z.enum(['text', 'mcq', 'quiz']);

export const McqOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const McqQuestionInputSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(McqOptionSchema).min(2),
  correctOptionId: z.string().min(1),
});

/** Student-facing questions omit `correctOptionId`. */
export const McqQuestionSchema = McqQuestionInputSchema.extend({
  correctOptionId: z.string().min(1).optional(),
});

export const McqAssignmentConfigInputSchema = z.object({
  questions: z.array(McqQuestionInputSchema).min(1),
});

export const McqAssignmentConfigSchema = z.object({
  questions: z.array(McqQuestionSchema).min(1),
});

export const CourseAssignmentSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  assignmentType: CourseAssignmentTypeSchema.optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  config: McqAssignmentConfigSchema.optional(),
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
  assignmentType: CourseAssignmentTypeSchema.optional(),
  description: z.string().max(5000).optional(),
  content: z.string().max(50000).optional(),
  config: McqAssignmentConfigInputSchema.optional(),
  dueAt: z.string().datetime().nullable().optional(),
  pointsPossible: z.number().int().positive().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  published: z.boolean().optional(),
});

export const UpdateCourseAssignmentRequestSchema = CreateCourseAssignmentRequestSchema.partial();

export const SubmitAssignmentRequestSchema = z
  .object({
    content: z.string().max(50000).optional(),
    answers: z.record(z.string(), z.string()).optional(),
    resources: z.array(AssignmentResourceSchema).optional(),
  })
  .refine((body) => Boolean(body.content?.trim()) || (body.answers && Object.keys(body.answers).length > 0), {
    message: 'content or answers required',
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

export type CourseAssignmentType = z.infer<typeof CourseAssignmentTypeSchema>;
export type McqAssignmentConfig = z.infer<typeof McqAssignmentConfigSchema>;
export type McqAssignmentConfigInput = z.infer<typeof McqAssignmentConfigInputSchema>;
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
