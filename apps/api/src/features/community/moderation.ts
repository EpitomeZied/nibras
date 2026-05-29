import {
  CommunityModerationStatus,
  CommunityReportStatus,
  CommunityReportTargetType,
  PrismaClient,
} from '@prisma/client';
import { AuthenticatedRequest } from '../../lib/auth';

export function visibleContentFilter(
  auth: AuthenticatedRequest | null,
  includeModerated?: boolean
): { moderationStatus?: CommunityModerationStatus } | Record<string, never> {
  if (includeModerated && auth?.user.systemRole === 'admin') {
    return {};
  }
  return { moderationStatus: CommunityModerationStatus.visible };
}

export async function setTargetModerationStatus(
  prisma: PrismaClient,
  targetType: CommunityReportTargetType,
  targetId: string,
  status: CommunityModerationStatus
): Promise<void> {
  switch (targetType) {
    case CommunityReportTargetType.question:
      await prisma.communityQuestion.update({
        where: { id: targetId },
        data: { moderationStatus: status },
      });
      break;
    case CommunityReportTargetType.answer:
      await prisma.communityAnswer.update({
        where: { id: targetId },
        data: { moderationStatus: status },
      });
      break;
    case CommunityReportTargetType.post:
      await prisma.communityPost.update({
        where: { id: targetId },
        data: { moderationStatus: status },
      });
      break;
    case CommunityReportTargetType.thread:
      await prisma.communityThread.update({
        where: { id: targetId },
        data: { moderationStatus: status },
      });
      break;
    default:
      break;
  }
}

export async function targetExists(
  prisma: PrismaClient,
  targetType: CommunityReportTargetType,
  targetId: string
): Promise<boolean> {
  switch (targetType) {
    case CommunityReportTargetType.question:
      return !!(await prisma.communityQuestion.findUnique({ where: { id: targetId } }));
    case CommunityReportTargetType.answer:
      return !!(await prisma.communityAnswer.findUnique({ where: { id: targetId } }));
    case CommunityReportTargetType.post:
      return !!(await prisma.communityPost.findUnique({ where: { id: targetId } }));
    case CommunityReportTargetType.thread:
      return !!(await prisma.communityThread.findUnique({ where: { id: targetId } }));
    default:
      return false;
  }
}

export async function findPendingReport(
  prisma: PrismaClient,
  reporterId: string,
  targetType: CommunityReportTargetType,
  targetId: string
) {
  return prisma.communityReport.findFirst({
    where: {
      reporterId,
      targetType,
      targetId,
      status: CommunityReportStatus.pending,
    },
  });
}
