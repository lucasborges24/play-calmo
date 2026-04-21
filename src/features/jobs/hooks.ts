import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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
    mutationFn: async (trigger: JobTrigger = 'manual') =>
      runFetchVideosJob(trigger, (nextProgress) => {
        setProgress(nextProgress);
      }),
    onSettled: () => {
      setProgress(null);
      void queryClient.invalidateQueries();
    },
  });

  return { ...mutation, progress };
}
