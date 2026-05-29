import { loadProjectManifest } from '@nibras/core';
import picocolors from 'picocolors';
import { findTrackingProjectByKey, listProjectMilestones } from '../util/projects';
import { emitJson } from '../util/output';
import { hasFlag } from '../util/args';

export async function commandMilestones(
  args: string[],
  plain: boolean,
  json: boolean
): Promise<void> {
  const projectKeyArg = args.find((arg) => !arg.startsWith('-'));
  let projectKey = projectKeyArg ?? null;

  if (!projectKey) {
    try {
      const { manifest } = loadProjectManifest(process.cwd());
      projectKey = manifest.projectKey;
    } catch {
      throw new Error(
        'No project in this directory. Run from a project root or pass: nibras milestones <projectKey>'
      );
    }
  }

  const project = await findTrackingProjectByKey(projectKey);
  if (!project) {
    throw new Error(`Project "${projectKey}" was not found in your enrolled courses.`);
  }

  const milestones = await listProjectMilestones(project.id);
  const sorted = [...milestones].sort((left, right) => left.order - right.order);

  if (json) {
    emitJson({ projectKey: project.projectKey, projectId: project.id, milestones: sorted });
    return;
  }

  if (sorted.length === 0) {
    console.log(
      plain
        ? `No milestones for ${project.projectKey}.`
        : '\n  ' + picocolors.dim(`No milestones for ${project.projectKey}.`) + '\n'
    );
    return;
  }

  if (!plain) {
    console.log('\n  ' + picocolors.bold(`Milestones · ${project.projectKey}`));
  } else {
    console.log(`Milestones for ${project.projectKey}`);
  }

  for (const milestone of sorted) {
    const slug = milestone.slug || milestone.id;
    const due = milestone.dueDateLabel || milestone.dueAt || 'no due date';
    const line = plain
      ? `  ${slug}  ${milestone.title}  (${due})`
      : `  ${picocolors.cyan(slug.padEnd(20))} ${milestone.title}  ${picocolors.dim(due)}`;
    console.log(line);
  }

  if (!plain && hasFlag(args, '--verbose')) {
    console.log(
      '\n  ' +
        picocolors.dim('Submit with: nibras submit --milestone <slug>') +
        '\n'
    );
  } else if (!plain) {
    console.log();
  }
}
