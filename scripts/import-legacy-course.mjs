#!/usr/bin/env node
/**
 * One-off import: copy section/video tree from a JSON file into a tracking course.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/import-legacy-course.mjs <courseId> <path-to.json>
 *
 * JSON shape: { sections: [{ title, videos: [{ title, provider, externalId?, embedUrl? }] }] }
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const courseId = process.argv[2];
const jsonPath = process.argv[3];
if (!courseId || !jsonPath) {
  console.error('Usage: node scripts/import-legacy-course.mjs <courseId> <json-file>');
  process.exit(1);
}

const prisma = new PrismaClient();
const data = JSON.parse(readFileSync(jsonPath, 'utf8'));

async function main() {
  const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!course) throw new Error(`Course ${courseId} not found`);

  let sectionOrder = 0;
  for (const section of data.sections ?? []) {
    const createdSection = await prisma.courseSection.create({
      data: {
        courseId,
        title: section.title,
        description: section.description ?? null,
        sortOrder: sectionOrder++,
      },
    });
    let videoOrder = 0;
    for (const video of section.videos ?? []) {
      await prisma.courseVideo.create({
        data: {
          sectionId: createdSection.id,
          title: video.title,
          description: video.description ?? null,
          provider: video.provider ?? 'youtube',
          externalId: video.externalId ?? video.youtubeId ?? null,
          embedUrl: video.embedUrl ?? video.html5 ?? null,
          durationSeconds: video.durationSeconds ?? null,
          sortOrder: videoOrder++,
        },
      });
    }
  }
  console.log(`Imported ${data.sections?.length ?? 0} sections into course ${courseId}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
