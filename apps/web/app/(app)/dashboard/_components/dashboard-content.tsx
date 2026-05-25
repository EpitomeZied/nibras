'use client';

import type { DashboardHomeResponse, DashboardMode } from '@nibras/contracts';
import type { TrackingActivityEvent } from '@nibras/contracts';
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

type DashboardUser = { username?: string | null } | null;

export default function DashboardContent({
  dashboard,
  activeMode,
  user,
  onModeChange,
  activity,
  achievements,
}: {
  dashboard: DashboardHomeResponse;
  activeMode: DashboardMode;
  user: DashboardUser;
  onModeChange: (mode: DashboardMode) => void;
  activity: TrackingActivityEvent[];
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
      <DashboardMetrics
        activeMode={activeMode}
        dashboard={dashboard}
        achievements={achievements}
      />

      {activeMode === 'student' && dashboard.student ? (
        <>
          <CourseSwitcher
            courses={dashboard.student.courses}
            selectedCourseId={dashboard.student.selectedCourseId}
          />
          <div className={styles.dashboardLayout}>
            <StudentDashboard student={dashboard.student} />
            <DashboardSidebar
              upcomingDeadlines={dashboard.student.upcomingDeadlines}
              courseSnapshots={dashboard.student.courseSnapshots}
              activity={activity}
              achievements={achievements}
            />
          </div>
        </>
      ) : activeMode === 'instructor' && dashboard.instructor ? (
        <InstructorDashboard instructor={dashboard.instructor} />
      ) : (
        <section className={styles.panel}>
          <EmptyPanel
            title="Dashboard mode unavailable"
            body="The selected role is not available for this account right now."
          />
        </section>
      )}
    </div>
  );
}
