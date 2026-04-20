import { desc, eq } from 'drizzle-orm';

import { db, schema } from '../client';
import type { JobRun, JobRunTrigger } from '../schema';

export async function startJobRun(trigger: JobRunTrigger) {
  const result = await db.insert(schema.jobRuns).values({
    startedAt: Date.now(),
    trigger,
    subsProcessed: 0,
    videosAdded: 0,
  });

  return Number(result.lastInsertRowId);
}

export async function finishJobRun(
  id: number,
  params: {
    subsProcessed: number;
    videosAdded: number;
    errorMessage?: string;
  },
) {
  await db
    .update(schema.jobRuns)
    .set({
      finishedAt: Date.now(),
      subsProcessed: params.subsProcessed,
      videosAdded: params.videosAdded,
      errorMessage: params.errorMessage ?? null,
    })
    .where(eq(schema.jobRuns.id, id));
}

export async function getLastJobRun(): Promise<JobRun | null> {
  const rows = await db.select().from(schema.jobRuns).orderBy(desc(schema.jobRuns.startedAt)).limit(1);

  return rows[0] ?? null;
}
