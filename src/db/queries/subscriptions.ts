import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { db, schema } from '../client';
import type { Subscription } from '../schema';

export type SubscriptionWithLatestPublishedAt = Subscription & {
  latestPublishedAt: number | null;
};

export function getAllSubscriptions() {
  return db.select().from(schema.subscriptions).orderBy(asc(schema.subscriptions.title));
}

export function getAllSubscriptionsWithLatestPublishedAt() {
  const latestPublishedAt = sql<number | null>`max(${schema.videos.publishedAt})`.as(
    'latestPublishedAt',
  );

  return db
    .select({
      channelId: schema.subscriptions.channelId,
      title: schema.subscriptions.title,
      thumbnailUrl: schema.subscriptions.thumbnailUrl,
      uploadsPlaylistId: schema.subscriptions.uploadsPlaylistId,
      isActive: schema.subscriptions.isActive,
      lastFetchedAt: schema.subscriptions.lastFetchedAt,
      subscribedAt: schema.subscriptions.subscribedAt,
      unsubscribedAt: schema.subscriptions.unsubscribedAt,
      createdAt: schema.subscriptions.createdAt,
      latestPublishedAt,
    })
    .from(schema.subscriptions)
    .leftJoin(schema.videos, eq(schema.videos.channelId, schema.subscriptions.channelId))
    .groupBy(
      schema.subscriptions.channelId,
      schema.subscriptions.title,
      schema.subscriptions.thumbnailUrl,
      schema.subscriptions.uploadsPlaylistId,
      schema.subscriptions.isActive,
      schema.subscriptions.lastFetchedAt,
      schema.subscriptions.subscribedAt,
      schema.subscriptions.unsubscribedAt,
      schema.subscriptions.createdAt,
    )
    .orderBy(asc(schema.subscriptions.title));
}

export function getActiveSubscriptions() {
  return db
    .select()
    .from(schema.subscriptions)
    .where(
      and(eq(schema.subscriptions.isActive, true), isNull(schema.subscriptions.unsubscribedAt)),
    )
    .orderBy(asc(schema.subscriptions.title));
}

export async function getSubscriptionsForJob(limit: number) {
  if (limit <= 0) {
    return [];
  }

  return db
    .select()
    .from(schema.subscriptions)
    .where(
      and(eq(schema.subscriptions.isActive, true), isNull(schema.subscriptions.unsubscribedAt)),
    )
    .orderBy(sql`random()`)
    .limit(limit);
}

export async function toggleSubscriptionActive(channelId: string, isActive: boolean) {
  await db
    .update(schema.subscriptions)
    .set({ isActive })
    .where(eq(schema.subscriptions.channelId, channelId));
}
