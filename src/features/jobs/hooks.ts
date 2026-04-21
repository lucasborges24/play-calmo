import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { runFetchVideosJob, type JobTrigger } from './fetch-videos-job';

type JobProgress = {
  current: number;
  total: number;
  videosAdded: number;
};

export function useRunJob() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<JobProgress | null>(null);

  const mutation = useMutation({
    onMutate: () => {
      setProgress({ current: 0, total: 0, videosAdded: 0 });
    },
    mutationFn: async (trigger: JobTrigger = 'manual') =>
      runFetchVideosJob(trigger, (nextProgress) => {
        setProgress(nextProgress);
      }),
    onSettled: () => {
      void queryClient.invalidateQueries();
    },
  });

  useEffect(() => {
    if (!mutation.isPending && progress !== null) {
      setProgress(null);
    }
  }, [mutation.isPending, progress]);

  return { ...mutation, progress };
}
