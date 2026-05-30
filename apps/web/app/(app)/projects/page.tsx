import ProjectsDashboard from './_components/projects-dashboard';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    courseId?: string | string[];
    course?: string | string[];
    projectId?: string | string[];
    view?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const courseId =
    typeof params?.courseId === 'string'
      ? params.courseId
      : typeof params?.course === 'string'
        ? params.course
        : null;
  const projectId = typeof params?.projectId === 'string' ? params.projectId : null;
  const view = typeof params?.view === 'string' ? params.view : null;
  return (
    <ProjectsDashboard initialCourseId={courseId} initialProjectId={projectId} initialView={view} />
  );
}
