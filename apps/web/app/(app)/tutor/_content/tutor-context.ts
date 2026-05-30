import { getCourseDetail, listMyTrackingCourses } from '../../../lib/services/course-profile';
import { listCourseSections } from '../../../lib/services/course-content';
import { lookupNibras75Starter } from '../../ide/_content/problem-context';

export type TutorContextParams = {
  courseId?: string | null;
  lectureId?: string | null;
  problem?: string | null;
  problemSource?: string | null;
  prompt?: string | null;
};

export type TutorContextState = {
  label: string;
  contextText: string;
  suggestedPrompts: string[];
};

const DEFAULT_PROMPTS = [
  'Explain Big-O notation with examples',
  'What is a binary search tree?',
  'How does TCP/IP work?',
  'Explain recursion vs iteration',
  'What are design patterns in OOP?',
  'How does garbage collection work?',
];

export function buildTutorAskHref(params: {
  courseId?: string;
  lectureId?: string;
  problem?: string;
  problemSource?: 'daily' | 'nibras75';
  prompt?: string;
}): string {
  const search = new URLSearchParams();
  if (params.courseId) search.set('courseId', params.courseId);
  if (params.lectureId) search.set('lectureId', params.lectureId);
  if (params.problem) search.set('problem', params.problem);
  if (params.problemSource) search.set('problemSource', params.problemSource);
  if (params.prompt) search.set('prompt', params.prompt);
  const qs = search.toString();
  return qs ? `/tutor?${qs}` : '/tutor';
}

export async function resolveTutorContext(
  params: TutorContextParams,
  enrolledCourseTitles: string[] = []
): Promise<TutorContextState> {
  const parts: string[] = [];
  let label = 'General CS help';

  if (params.courseId) {
    try {
      const course = await getCourseDetail(params.courseId);
      parts.push(`Course: ${course.title} (${course.courseCode || course.slug})`);
      label = course.title;

      if (params.lectureId) {
        const sections = await listCourseSections(params.courseId);
        for (const section of sections) {
          const lecture = section.videos.find((v) => v.id === params.lectureId);
          if (lecture) {
            parts.push(`Lecture: ${lecture.title}`);
            if (lecture.description) parts.push(`Lecture summary: ${lecture.description}`);
            label = `${course.title} · ${lecture.title}`;
            break;
          }
        }
      }
    } catch {
      // ignore missing course metadata
    }
  }

  if (params.problem) {
    const source =
      params.problemSource === 'nibras75' || params.problemSource === 'daily'
        ? params.problemSource
        : 'daily';
    const curated = source === 'nibras75' ? lookupNibras75Starter(params.problem) : null;
    const title = curated?.title || params.problem.replace(/-/g, ' ');
    const description = curated?.description || 'Practice this problem in the Nibras IDE.';
    parts.push(`Practice problem: ${title}`);
    parts.push(`Problem statement: ${description}`);
    label = title;
  }

  const suggestedPrompts =
    enrolledCourseTitles.length > 0
      ? enrolledCourseTitles
          .slice(0, 3)
          .flatMap((title) => [
            `Explain a core concept from ${title}`,
            `What should I focus on next in ${title}?`,
          ])
          .slice(0, 6)
      : DEFAULT_PROMPTS;

  if (params.prompt?.trim()) {
    suggestedPrompts.unshift(params.prompt.trim());
  }

  return {
    label,
    contextText: parts.join('\n'),
    suggestedPrompts: [...new Set(suggestedPrompts)].slice(0, 6),
  };
}

export async function loadEnrolledCourseTitles(): Promise<string[]> {
  try {
    const courses = await listMyTrackingCourses();
    return courses.filter((c) => c.isActive !== false).map((c) => c.title);
  } catch {
    return [];
  }
}
