type SortablePlanVideo = {
  position: number;
  watchedAt: number | null;
};

export function sortPlanVideos<T extends SortablePlanVideo>(videos: readonly T[]): T[] {
  return [...videos].sort((left, right) => {
    const leftIsWatched = left.watchedAt !== null;
    const rightIsWatched = right.watchedAt !== null;

    if (leftIsWatched !== rightIsWatched) {
      return leftIsWatched ? 1 : -1;
    }

    if (!leftIsWatched && !rightIsWatched) {
      return left.position - right.position;
    }

    if (left.watchedAt !== right.watchedAt) {
      return (left.watchedAt ?? 0) - (right.watchedAt ?? 0);
    }

    return left.position - right.position;
  });
}
