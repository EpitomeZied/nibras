/** Email notification preference types (Settings → Notifications). Default: enabled when unset. */
export const NOTIFICATION_EMAIL_PREF = {
  SUBMISSION_RESULTS: 'submission_results',
  GRADE_POSTED: 'grade_posted',
  REVIEW_QUEUE: 'review_queue',
  ASSIGNMENT_DEADLINE: 'assignment_deadline',
  COURSE_ANNOUNCEMENT: 'course_announcement',
  EMAIL_DIGEST: 'email_digest',
} as const;

export type NotificationEmailPrefType =
  (typeof NOTIFICATION_EMAIL_PREF)[keyof typeof NOTIFICATION_EMAIL_PREF];
