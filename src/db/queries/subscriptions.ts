import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { db, schema } from '../client';

export function getAllSubscriptions() {
  return db.select().from(schema.subscriptions).orderBy(asc(schema.subscriptions.title));
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
