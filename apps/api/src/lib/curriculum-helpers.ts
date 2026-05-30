/**
 * Shared helpers for year curriculum course definitions.
 */
import type {
  Year1Assignment,
  Year1Milestone,
  Year1ProjectDefinition,
  Year1RubricItem,
} from './year1-curriculum';

export function curriculumProject(
  subject: { slug: string; name: string },
  slug: string,
  name: string,
  description: string,
  level: number,
  rubric: Year1RubricItem[],
  milestones: Year1Milestone[]
): Year1ProjectDefinition {
  return { subject, slug, name, description, level, rubric, milestones };
}

export function curriculumAssignments(
  items: Array<{
    title: string;
    description: string;
    content: string;
    dueAt: string;
    pointsPossible?: number;
    sortOrder?: number;
  }>
): Year1Assignment[] {
  return items.map((item, index) => ({
    pointsPossible: item.pointsPossible ?? 100,
    sortOrder: item.sortOrder ?? index,
    title: item.title,
    description: item.description,
    content: item.content,
    dueAt: item.dueAt,
  }));
}

export function standardSections(titles: string[]): Array<{ title: string; sortOrder: number }> {
  return titles.map((title, sortOrder) => ({ title, sortOrder }));
}
