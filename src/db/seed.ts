import { db, schema } from './client';

export async function seedIfNeeded() {
  const existing = await db.select().from(schema.settings).limit(1);

  if (existing.length === 0) {
    await db.insert(schema.settings).values({
      id: 1,
      dailyTargetHours: 2,
      maxSubsPerJob: 25,
      videosPerSub: 5,
      includeTrending: false,
      trendingRegionCode: 'BR',
      notificationsEnabled: false,
      notificationHour: 7,
    });
  }
}
