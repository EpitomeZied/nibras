import { PrismaClient } from '@prisma/client';

function log(level: string, msg: string, extra?: Record<string, unknown>) {
  process.stdout.write(
    JSON.stringify({ level, time: new Date().toISOString(), msg, ...extra }) + '\n'
  );
}

export async function runContestReminder(prisma: PrismaClient): Promise<void> {
  const now = new Date();

  const dueReminders = await prisma.contestReminder.findMany({
    where: { notified: false },
    include: { contest: true },
  });

  let notified = 0;

  for (const reminder of dueReminders) {
    const triggerTime = new Date(
      reminder.contest.startsAt.getTime() - reminder.minutesBefore * 60000
    );

    if (now >= triggerTime) {
      await prisma.notification.create({
        data: {
          userId: reminder.userId,
          type: 'contest_reminder',
          title: `Contest starting soon: ${reminder.contest.name}`,
          body: `${reminder.contest.name} on ${reminder.contest.platform} starts in ${reminder.minutesBefore} minutes.`,
          link: reminder.contest.url,
        },
      });

      await prisma.contestReminder.update({
        where: { id: reminder.id },
        data: { notified: true },
      });

      notified++;
    }
  }

  if (notified > 0) {
    log('info', `Contest reminders: sent ${notified} notifications`);
  }
}
