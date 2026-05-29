import { apiRequest } from '@nibras/core';
import picocolors from 'picocolors';
import { hasFlag } from '../util/args';
import { emitJson, unwrapList } from '../util/output';
import { listProjectMilestones } from '../util/projects';

type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  termLabel: string;
  courseCode: string;
  isActive: boolean;
};

type ProjectSummary = {
  id: string;
  title: string;
  projectKey: string;
  status: string;
  deliveryMode: string;
};

export async function commandList(
  args: string[],
  plain: boolean,
  json: boolean
): Promise<void> {
  const verbose = hasFlag(args, '--verbose');
  const courses = unwrapList<CourseSummary>(await apiRequest('/v1/tracking/courses'), 'courses');

  if (courses.length === 0) {
    if (json) {
      emitJson({ courses: [] });
      return;
    }
    console.log(plain ? 'No courses found.' : '\n  ' + picocolors.dim('No courses found.') + '\n');
    return;
  }

  const payload: Array<{
    course: CourseSummary;
    projects: Array<ProjectSummary & { milestones?: Awaited<ReturnType<typeof listProjectMilestones>> }>;
  }> = [];

  for (const course of courses) {
    let projects: ProjectSummary[] = [];
    try {
      projects = unwrapList<ProjectSummary>(
        await apiRequest(`/v1/tracking/courses/${course.id}/projects`),
        'projects'
      );
    } catch {
      projects = [];
    }

    const projectsWithMilestones = [];
    for (const project of projects) {
      let milestones: Awaited<ReturnType<typeof listProjectMilestones>> | undefined;
      if (verbose) {
        try {
          milestones = await listProjectMilestones(project.id);
        } catch {
          milestones = [];
        }
      }
      projectsWithMilestones.push({ ...project, milestones });
    }

    payload.push({ course, projects: projectsWithMilestones });
  }

  if (json) {
    emitJson({ courses: payload });
    return;
  }

  for (const { course, projects } of payload) {
    const courseLabel = plain
      ? `${course.title} (${course.courseCode} — ${course.termLabel})`
      : picocolors.cyan(`${course.title}`) +
        picocolors.dim(` · ${course.courseCode} · ${course.termLabel}`);

    console.log((plain ? '' : '\n') + '  ' + courseLabel);

    if (projects.length === 0) {
      console.log('    ' + (plain ? '(no projects)' : picocolors.dim('(no projects)')));
      continue;
    }

    for (const project of projects) {
      const statusColor =
        project.status === 'published'
          ? picocolors.green
          : project.status === 'archived'
            ? picocolors.red
            : picocolors.yellow;
      const statusBadge = plain ? `[${project.status}]` : statusColor(`[${project.status}]`);
      const modeLabel = project.deliveryMode === 'team' ? ' (team)' : '';
      const projectLine = plain
        ? `  - ${project.title} (${project.projectKey})${modeLabel} ${statusBadge}`
        : `  ${picocolors.dim('·')} ${picocolors.white(project.title)}${picocolors.dim(` · ${project.projectKey}${modeLabel}`)}  ${statusBadge}`;
      console.log('  ' + projectLine);

      if (verbose && project.milestones) {
        const milestones = [...project.milestones].sort((left, right) => left.order - right.order);
        if (milestones.length === 0) {
          console.log('      ' + (plain ? '(no milestones)' : picocolors.dim('(no milestones)')));
        }
        for (const milestone of milestones) {
          const slug = milestone.slug || milestone.id;
          const due = milestone.dueDateLabel || milestone.dueAt || 'no due date';
          const milestoneLine = plain
            ? `      - ${slug}: ${milestone.title} (${due})`
            : `      ${picocolors.dim('↳')} ${picocolors.white(slug)} ${picocolors.dim(milestone.title)} · ${due}`;
          console.log(milestoneLine);
        }
      }
    }
  }

  if (!plain) {
    console.log();
  }
}
