import type { SectionNavItem } from './section-nav';

export const plannerSections: SectionNavItem[] = [
  { href: '/planner', label: 'Overview' },
  { href: '/planner/track', label: 'Track' },
  { href: '/planner/petitions', label: 'Petitions' },
  { href: '/planner/sheet', label: 'Sheet' },
];

export function programSections(programId: string): SectionNavItem[] {
  return [
    { href: `/instructor/programs/${programId}`, label: 'Overview' },
    { href: `/instructor/programs/${programId}/requirements`, label: 'Requirements' },
    { href: `/instructor/programs/${programId}/tracks`, label: 'Tracks' },
    { href: `/instructor/programs/${programId}/petitions`, label: 'Petitions' },
  ];
}

export const analyticsSections: SectionNavItem[] = [
  { href: '/instructor/analytics', label: 'Overview' },
  { href: '/instructor/analytics/students', label: 'Students' },
  { href: '/instructor/analytics/courses', label: 'Courses' },
  { href: '/instructor/analytics/engagement', label: 'Engagement' },
];

export function instructorCourseSections(courseId: string): SectionNavItem[] {
  return [
    { href: `/instructor/courses/${courseId}`, label: 'Overview' },
    { href: `/instructor/courses/${courseId}/submissions`, label: 'Submissions' },
    { href: `/instructor/courses/${courseId}/members`, label: 'Members' },
    { href: `/instructor/courses/${courseId}/content`, label: 'Lectures' },
    { href: `/instructor/courses/${courseId}/assignments`, label: 'Assignments' },
    { href: `/instructor/courses/${courseId}/grades`, label: 'Grades' },
    { href: `/instructor/courses/${courseId}/discussions`, label: 'Discussions' },
    { href: `/instructor/courses/${courseId}/analytics`, label: 'Analytics' },
    { href: `/instructor/courses/${courseId}/settings`, label: 'Settings' },
  ];
}
