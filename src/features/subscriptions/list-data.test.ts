import type { SubscriptionWithLatestPublishedAt } from '@/db/queries/subscriptions';

import { buildSubscriptionListData } from './list-data';

function subscription(
  title: string,
  latestPublishedAt: number | null,
  overrides: Partial<SubscriptionWithLatestPublishedAt> = {},
): SubscriptionWithLatestPublishedAt {
  return {
    channelId: title,
    createdAt: 1,
    isActive: true,
    lastFetchedAt: null,
    latestPublishedAt,
    subscribedAt: null,
    thumbnailUrl: null,
    title,
    unsubscribedAt: null,
    uploadsPlaylistId: `${title}-uploads`,
    ...overrides,
  };
}

describe('buildSubscriptionListData', () => {
  it('filters titles in real time without considering accents', () => {
    const result = buildSubscriptionListData(
      [subscription('Árvore Calma', 100), subscription('Brisa Serena', 200)],
      'arvore',
      'name',
    );

    expect(result.visibleCount).toBe(1);
    expect(result.items).toEqual([
      {
        count: 1,
        key: 'subscription-group-A',
        kind: 'section',
        title: 'A',
      },
      {
        key: 'Árvore Calma',
        kind: 'subscription',
        subscription: subscription('Árvore Calma', 100),
      },
    ]);
  });

  it('keeps alphabetical groups when sorting by name', () => {
    const result = buildSubscriptionListData(
      [
        subscription('Andrei Mayer', 50),
        subscription('Adilson está aqui', 200),
        subscription('Brisa Serena', 500),
        subscription('Bons Sons', 300),
        subscription('3Blue1Brown', 400),
      ],
      '',
      'name',
    );

    expect(result.stickyHeaderIndices).toEqual([0, 3, 6]);
    expect(
      result.items.map((item) =>
        item.kind === 'section' ? item.title : item.subscription.title,
      ),
    ).toEqual(['A', 'Adilson está aqui', 'Andrei Mayer', 'B', 'Bons Sons', 'Brisa Serena', '#', '3Blue1Brown']);
  });

  it('sorts channels directly by latest publication when requested', () => {
    const result = buildSubscriptionListData(
      [
        subscription('Andrei Mayer', 50),
        subscription('Adilson está aqui', 200),
        subscription('Brisa Serena', 500),
        subscription('Bons Sons', 300),
        subscription('3Blue1Brown', 400),
      ],
      '',
      'latest-published',
    );

    expect(result.stickyHeaderIndices).toEqual([]);
    expect(result.items.every((item) => item.kind === 'subscription')).toBe(true);
    expect(
      result.items.map((item) =>
        item.kind === 'subscription' ? item.subscription.title : item.title,
      ),
    ).toEqual([
      'Brisa Serena',
      '3Blue1Brown',
      'Bons Sons',
      'Adilson está aqui',
      'Andrei Mayer',
    ]);
  });
});
