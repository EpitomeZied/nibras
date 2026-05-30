'use client';

import { useMemo } from 'react';
import type { StudentProjectsDashboardResponse, TrackingMilestone } from '@nibras/contracts';

export type MilestoneStatusFilter = 'all' | 'open' | 'review' | 'approved';

export function useMilestoneFilters(
  milestones: TrackingMilestone[],
  searchQuery: string,
  statusFilter: MilestoneStatusFilter
) {
  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return milestones.filter((milestone) => {
      if (statusFilter === 'open' && milestone.status !== 'open') return false;
      if (
        statusFilter === 'review' &&
        milestone.status !== 'submitted' &&
        milestone.status !== 'under_review' &&
        milestone.status !== 'changes_requested'
      ) {
        return false;
      }
      if (
        statusFilter === 'approved' &&
        milestone.status !== 'approved' &&
        milestone.status !== 'graded'
      ) {
        return false;
      }
      if (!query) return true;
      return milestone.title.toLowerCase().includes(query);
    });
  }, [milestones, searchQuery, statusFilter]);
}

export function useProjectSearch(
  dashboard: StudentProjectsDashboardResponse | null,
  searchQuery: string
) {
  return useMemo(() => {
    if (!dashboard) return [];
    const query = searchQuery.trim().toLowerCase();
    return dashboard.projects.filter((project) => {
      if (!query) return true;
      if (project.title.toLowerCase().includes(query)) return true;
      return (dashboard.milestonesByProject[project.id] ?? []).some((m) =>
        m.title.toLowerCase().includes(query)
      );
    });
  }, [dashboard, searchQuery]);
}
