'use client';

import type { DashboardHomeResponse, DashboardMode } from '@nibras/contracts';
import type { AchievementsDashboard } from '../../../lib/services/gamification';
import styles from '../page.module.css';
import CourseSwitcher from './course-switcher';
import DashboardHero from './dashboard-hero';
import DashboardMetrics from './dashboard-metrics';
import DashboardSidebar from './dashboard-sidebar';
import InstructorDashboard from './instructor-dashboard';
import StudentDashboard from './student-dashboard';
import { EmptyPanel } from './dashboard-shared';

export { default as DashboardSkeleton } from './dashboard-skeleton';
export { default as DashboardErrorState } from './dashboard-error';

type DashboardUser = { username?: string | null; displayName?: string | null } | null;

export default function DashboardContent({
  dashboard,
  activeMode,
  user,
  onModeChange,
  achievements,
}: {
  dashboard: DashboardHomeResponse;
  activeMode: DashboardMode;
  user: DashboardUser;
  onModeChange: (mode: DashboardMode) => void;
  achievements: AchievementsDashboard | null;
}) {
  return (
    <div className={styles.page}>
      <DashboardHero
        dashboard={dashboard}
        activeMode={activeMode}
        user={user}
        onModeChange={onModeChange}
      />
      {activeMode === 'student' && dashboard.student ? (
        <>
          <CourseSwitcher
            courses={dashboard.student.courses}
            selectedCourseId={dashboard.student.selectedCourseId}
          />
          <DashboardMetrics
            activeMode={activeMode}
            dashboard={dashboard}
            achievements={achievements}
          />
          <div className={styles.dashboardLayout}>
            <StudentDashboard student={dashboard.student} />
            <DashboardSidebar
              upcomingDeadlines={dashboard.student.upcomingDeadlines}
              courseSnapshots={dashboard.student.courseSnapshots}
              achievements={achievements}
            />
          </div>
        </>
      ) : (
        <>
          <DashboardMetrics
            activeMode={activeMode}
            dashboard={dashboard}
            achievements={achievements}
          />
          {activeMode === 'instructor' && dashboard.instructor ? (
            <InstructorDashboard instructor={dashboard.instructor} />
          ) : (
            <section className={styles.panel}>
              <EmptyPanel
                title="Dashboard mode unavailable"
                body="The selected role is not available for this account right now."
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
