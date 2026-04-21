import { eq } from 'drizzle-orm';

import { db, schema } from '@/db/client';
import type { NewSubscription } from '@/db/schema';

import { fetchAllSubscriptionsFromYouTube, fetchChannelsUploadsPlaylists } from './api';

type SyncSubscriptionsResult = {
  added: number;
  updated: number;
  unsubscribed: number;
};

type SubscriptionPatch = Partial<
  Pick<
    NewSubscription,
    'isActive' | 'subscribedAt' | 'thumbnailUrl' | 'title' | 'unsubscribedAt' | 'uploadsPlaylistId'
  >
>;

export async function syncSubscriptions(): Promise<SyncSubscriptionsResult> {
  const fromYT = await fetchAllSubscriptionsFromYouTube();
  const fromYTIds = new Set(fromYT.map((subscription) => subscription.channelId));
  const existing = await db.select().from(schema.subscriptions);
  const existingMap = new Map(existing.map((subscription) => [subscription.channelId, subscription]));
  const syncAt = Date.now();

  const channelIdsNeedingUploads = Array.from(
    new Set(
      fromYT
        .filter((subscription) => {
          const existingSubscription = existingMap.get(subscription.channelId);
          return !existingSubscription || !existingSubscription.uploadsPlaylistId;
        })
        .map((subscription) => subscription.channelId),
    ),
  );

  const uploadsMap =
    channelIdsNeedingUploads.length > 0
      ? await fetchChannelsUploadsPlaylists(channelIdsNeedingUploads)
      : {};

  let added = 0;
  let updated = 0;
  let unsubscribed = 0;

  db.transaction((tx) => {
    for (const subscription of fromYT) {
      const previous = existingMap.get(subscription.channelId);

      if (!previous) {
        const uploadsPlaylistId = uploadsMap[subscription.channelId];

        if (!uploadsPlaylistId) {
          continue;
        }

        tx
          .insert(schema.subscriptions)
          .values({
            channelId: subscription.channelId,
            title: subscription.title,
            thumbnailUrl: subscription.thumbnailUrl,
            uploadsPlaylistId,
            isActive: true,
            subscribedAt: subscription.subscribedAt,
            createdAt: syncAt,
          })
          .run();

        added += 1;
        continue;
      }

      const patch: SubscriptionPatch = {};
      const uploadsPlaylistId = previous.uploadsPlaylistId || uploadsMap[subscription.channelId];

      if (!previous.uploadsPlaylistId && uploadsPlaylistId) {
        patch.uploadsPlaylistId = uploadsPlaylistId;
      }

      if (previous.title !== subscription.title) {
        patch.title = subscription.title;
      }

      if (previous.thumbnailUrl !== subscription.thumbnailUrl) {
        patch.thumbnailUrl = subscription.thumbnailUrl;
      }

      if (subscription.subscribedAt !== null && previous.subscribedAt !== subscription.subscribedAt) {
        patch.subscribedAt = subscription.subscribedAt;
      }

      if (previous.unsubscribedAt) {
        patch.unsubscribedAt = null;
        patch.isActive = true;
      }

      if (Object.keys(patch).length > 0) {
        tx
          .update(schema.subscriptions)
          .set(patch)
          .where(eq(schema.subscriptions.channelId, subscription.channelId))
          .run();

        updated += 1;
      }
    }

    for (const previous of existing) {
      if (!fromYTIds.has(previous.channelId) && !previous.unsubscribedAt) {
        tx
          .update(schema.subscriptions)
          .set({ unsubscribedAt: syncAt, isActive: false })
          .where(eq(schema.subscriptions.channelId, previous.channelId))
          .run();

        unsubscribed += 1;
      }
    }

    tx.update(schema.settings).set({ lastSubsSyncAt: syncAt }).where(eq(schema.settings.id, 1)).run();
  });

  return { added, updated, unsubscribed };
}
