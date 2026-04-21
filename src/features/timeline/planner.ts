import { and, eq, isNull, notInArray, sql } from 'drizzle-orm';

import { db, schema } from '@/db/client';
import { getSettings } from '@/db/queries/settings';
import type { Video } from '@/db/schema';

const PLAN_MARGIN = 0.05;
const MAX_GREEDY_ATTEMPTS = 24;

type PlannerCandidate = Pick<Video, 'durationSeconds' | 'videoId'>;

type PlanBounds = {
  lower: number;
  target: number;
  upper: number;
};

type PickVideosParams = {
  candidates: PlannerCandidate[];
  initialTotal?: number;
  lower: number;
  target: number;
  upper: number;
};

function shuffleCandidates<T>(rows: T[]) {
  const next = [...rows];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex] as T;
    next[swapIndex] = current as T;
  }

  return next;
}

function getPlanBounds(targetMinutes: number): PlanBounds {
  const target = Math.max(0, Math.floor(targetMinutes * 60));
  const lower = Math.floor(target * (1 - PLAN_MARGIN));
  const upper = Math.ceil(target * (1 + PLAN_MARGIN));

  return { lower, target, upper };
}

function isBetterPlan(
  currentTotal: number,
  nextTotal: number,
  lower: number,
  target: number,
  upper: number,
) {
  const currentWithinBounds = currentTotal >= lower && currentTotal <= upper;
  const nextWithinBounds = nextTotal >= lower && nextTotal <= upper;

  if (nextWithinBounds && !currentWithinBounds) {
    return true;
  }

  if (currentWithinBounds && !nextWithinBounds) {
    return false;
  }

  const currentDistance = Math.abs(target - currentTotal);
  const nextDistance = Math.abs(target - nextTotal);

  if (nextDistance !== currentDistance) {
    return nextDistance < currentDistance;
  }

  return nextTotal > currentTotal;
}

export function pickVideosForPlan({
  candidates,
  initialTotal = 0,
  lower,
  target,
  upper,
}: PickVideosParams) {
  const eligible = candidates.filter(
    (candidate) =>
      candidate.durationSeconds > 0 && initialTotal + candidate.durationSeconds <= upper,
  );

  let bestChosen: PlannerCandidate[] = [];
  let bestTotal = initialTotal;
  const attempts = Math.max(1, Math.min(MAX_GREEDY_ATTEMPTS, eligible.length || 1));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const pool =
      attempt % 3 === 0
        ? shuffleCandidates(eligible)
        : attempt % 3 === 1
          ? [...shuffleCandidates(eligible)].sort((left, right) => right.durationSeconds - left.durationSeconds)
          : [...shuffleCandidates(eligible)].sort((left, right) => left.durationSeconds - right.durationSeconds);
    const chosen: PlannerCandidate[] = [];
    let total = initialTotal;

    for (const candidate of pool) {
      if (total + candidate.durationSeconds > upper) {
        continue;
      }

      chosen.push(candidate);
      total += candidate.durationSeconds;

      if (total >= lower) {
        break;
      }
    }

    if (isBetterPlan(bestTotal, total, lower, target, upper)) {
      bestChosen = chosen;
      bestTotal = total;
    }
  }

  return { chosen: bestChosen, total: bestTotal };
}

export function getTodayDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function generateDailyPlan(
  dateStr: string,
  targetMinutes: number,
): Promise<{ planId: number }> {
  const existingPlan = await db
    .select({ id: schema.dailyPlans.id })
    .from(schema.dailyPlans)
    .where(eq(schema.dailyPlans.planDate, dateStr))
    .limit(1);

  if (existingPlan[0]) {
    return { planId: existingPlan[0].id };
  }

  const { lower, target, upper } = getPlanBounds(targetMinutes);
  const candidates = await db
    .select({
      durationSeconds: schema.videos.durationSeconds,
      videoId: schema.videos.videoId,
    })
    .from(schema.videos)
    .where(and(isNull(schema.videos.watchedAt), isNull(schema.videos.excludedAt)))
    .orderBy(sql`random()`);

  const { chosen } = pickVideosForPlan({
    candidates,
    lower,
    target,
    upper,
  });

  let planId = 0;

  db.transaction((tx) => {
    const result = tx
      .insert(schema.dailyPlans)
      .values({
        planDate: dateStr,
        targetMinutes,
        generatedAt: Date.now(),
      })
      .run();

    planId = Number(result.lastInsertRowId);

    if (chosen.length > 0) {
      tx.insert(schema.dailyPlanVideos)
        .values(
          chosen.map((video, index) => ({
            planId,
            videoId: video.videoId,
            position: index,
          })),
        )
        .run();
    }
  });

  return { planId };
}

export async function getOrCreateTodayPlan(): Promise<{ planId: number; isNew: boolean }> {
  const today = getTodayDateString();
  const existing = await db
    .select({ id: schema.dailyPlans.id })
    .from(schema.dailyPlans)
    .where(eq(schema.dailyPlans.planDate, today))
    .limit(1);

  if (existing[0]) {
    return { planId: existing[0].id, isNew: false };
  }

  const settings = await getSettings();
  const { planId } = await generateDailyPlan(today, settings.dailyTargetHours * 60);

  return { planId, isNew: true };
}

export async function refillPlan(planId: number): Promise<void> {
  const plans = await db
    .select()
    .from(schema.dailyPlans)
    .where(eq(schema.dailyPlans.id, planId))
    .limit(1);
  const plan = plans[0];

  if (!plan) {
    return;
  }

  const { lower, target, upper } = getPlanBounds(plan.targetMinutes);
  const activePlanVideos = await db
    .select({
      durationSeconds: schema.videos.durationSeconds,
    })
    .from(schema.dailyPlanVideos)
    .innerJoin(schema.videos, eq(schema.dailyPlanVideos.videoId, schema.videos.videoId))
    .where(
      and(
        eq(schema.dailyPlanVideos.planId, planId),
        isNull(schema.dailyPlanVideos.removedAt),
        isNull(schema.videos.watchedAt),
        isNull(schema.videos.excludedAt),
      ),
    );

  const currentTotal = activePlanVideos.reduce((sum, row) => sum + row.durationSeconds, 0);

  if (currentTotal >= lower) {
    return;
  }

  const planEntries = await db
    .select({ videoId: schema.dailyPlanVideos.videoId })
    .from(schema.dailyPlanVideos)
    .where(eq(schema.dailyPlanVideos.planId, planId));
  const inPlanVideoIds = planEntries.map((row) => row.videoId);

  const candidates = await db
    .select({
      durationSeconds: schema.videos.durationSeconds,
      videoId: schema.videos.videoId,
    })
    .from(schema.videos)
    .where(
      and(
        isNull(schema.videos.watchedAt),
        isNull(schema.videos.excludedAt),
        inPlanVideoIds.length > 0
          ? notInArray(schema.videos.videoId, inPlanVideoIds)
          : sql`1 = 1`,
      ),
    )
    .orderBy(sql`random()`);

  const { chosen } = pickVideosForPlan({
    candidates,
    initialTotal: currentTotal,
    lower,
    target,
    upper,
  });

  if (chosen.length === 0) {
    return;
  }

  const positionRows = await db
    .select({ maxPosition: sql<number>`coalesce(max(${schema.dailyPlanVideos.position}), -1)` })
    .from(schema.dailyPlanVideos)
    .where(eq(schema.dailyPlanVideos.planId, planId))
    .limit(1);
  let nextPosition = (positionRows[0]?.maxPosition ?? -1) + 1;

  db.insert(schema.dailyPlanVideos)
    .values(
      chosen.map((video) => ({
        planId,
        videoId: video.videoId,
        position: nextPosition++,
      })),
    )
    .run();
}

export function getPlanMarginBounds(targetMinutes: number) {
  return getPlanBounds(targetMinutes);
}
