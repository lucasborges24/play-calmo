import { useRef } from 'react';

export type RetainedLiveQueryData<T> = {
  data: T | undefined;
  hasResolvedOnce: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
};

export function useRetainedLiveQueryData<T>(data: T | undefined): RetainedLiveQueryData<T> {
  const retainedDataRef = useRef<T | undefined>(data);
  const hasResolvedOnceRef = useRef(data !== undefined);

  if (data !== undefined) {
    retainedDataRef.current = data;
    hasResolvedOnceRef.current = true;
  }

  const hasResolvedOnce = hasResolvedOnceRef.current;

  return {
    data: data === undefined && hasResolvedOnce ? retainedDataRef.current : data,
    hasResolvedOnce,
    isInitialLoading: data === undefined && !hasResolvedOnce,
    isRefreshing: data === undefined && hasResolvedOnce,
  };
}
