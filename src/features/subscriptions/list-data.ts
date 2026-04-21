import type { SubscriptionWithLatestPublishedAt } from '@/db/queries/subscriptions';

export type SubscriptionSort = 'latest-published' | 'name';

export type SubscriptionListSectionItem = {
  count: number;
  key: string;
  kind: 'section';
  title: string;
};

export type SubscriptionListChannelItem = {
  key: string;
  kind: 'subscription';
  subscription: SubscriptionWithLatestPublishedAt;
};

export type SubscriptionListItem = SubscriptionListSectionItem | SubscriptionListChannelItem;

type BuildSubscriptionListDataResult = {
  items: SubscriptionListItem[];
  stickyHeaderIndices: number[];
  visibleCount: number;
};

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function getGroupTitle(title: string) {
  const normalizedInitial = normalizeSearchValue(title).charAt(0).toUpperCase();

  if (/^[A-Z]$/.test(normalizedInitial)) {
    return normalizedInitial;
  }

  return '#';
}

function compareByName(
  left: SubscriptionWithLatestPublishedAt,
  right: SubscriptionWithLatestPublishedAt,
) {
  return left.title.localeCompare(right.title, 'pt-BR', { sensitivity: 'base' });
}

function compareByLatestPublished(
  left: SubscriptionWithLatestPublishedAt,
  right: SubscriptionWithLatestPublishedAt,
) {
  const leftTimestamp = left.latestPublishedAt ?? Number.NEGATIVE_INFINITY;
  const rightTimestamp = right.latestPublishedAt ?? Number.NEGATIVE_INFINITY;

  if (leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  return compareByName(left, right);
}

export function buildSubscriptionListData(
  subscriptions: SubscriptionWithLatestPublishedAt[],
  search: string,
  sort: SubscriptionSort,
): BuildSubscriptionListDataResult {
  const normalizedSearch = normalizeSearchValue(search);
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (!normalizedSearch) {
      return true;
    }

    return normalizeSearchValue(subscription.title).includes(normalizedSearch);
  });
  const sortComparator = sort === 'latest-published' ? compareByLatestPublished : compareByName;
  const sortedSubscriptions = [...filteredSubscriptions].sort(sortComparator);

  if (sort === 'latest-published') {
    return {
      items: sortedSubscriptions.map((subscription) => ({
        key: subscription.channelId,
        kind: 'subscription',
        subscription,
      })),
      stickyHeaderIndices: [],
      visibleCount: filteredSubscriptions.length,
    };
  }

  const groups = new Map<string, SubscriptionWithLatestPublishedAt[]>();

  for (const subscription of sortedSubscriptions) {
    const groupTitle = getGroupTitle(subscription.title);
    const currentGroup = groups.get(groupTitle) ?? [];

    currentGroup.push(subscription);
    groups.set(groupTitle, currentGroup);
  }

  const sortedGroupTitles = Array.from(groups.keys()).sort((left, right) => {
    if (left === '#') {
      return 1;
    }

    if (right === '#') {
      return -1;
    }

    return left.localeCompare(right, 'pt-BR', { sensitivity: 'base' });
  });
  const items: SubscriptionListItem[] = [];
  const stickyHeaderIndices: number[] = [];

  for (const groupTitle of sortedGroupTitles) {
    stickyHeaderIndices.push(items.length);
    const sectionSubscriptions = groups.get(groupTitle) ?? [];

    items.push({
      count: sectionSubscriptions.length,
      key: `subscription-group-${groupTitle}`,
      kind: 'section',
      title: groupTitle,
    });

    for (const subscription of sectionSubscriptions) {
      items.push({
        key: subscription.channelId,
        kind: 'subscription',
        subscription,
      });
    }
  }

  return {
    items,
    stickyHeaderIndices,
    visibleCount: filteredSubscriptions.length,
  };
}
