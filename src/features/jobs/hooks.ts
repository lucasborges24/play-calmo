import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { runFetchVideosJob, type JobTrigger } from './fetch-videos-job';

type JobProgress = {
  current: number;
  total: number;
  videosAdded: number;
};

type JobCancellationController = {
  cancel: () => void;
  isCancelled: () => boolean;
};

function createJobCancellationController(): JobCancellationController {
  let cancelled = false;

  return {
    cancel: () => {
      cancelled = true;
    },
    isCancelled: () => cancelled,
  };
}

export function useRunJob() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancellationControllerRef = useRef<JobCancellationController | null>(null);

  const mutation = useMutation({
    onMutate: () => {
      cancellationControllerRef.current = createJobCancellationController();
      setIsCancelling(false);
      setProgress({ current: 0, total: 0, videosAdded: 0 });
    },
    mutationFn: async (trigger: JobTrigger = 'manual') => {
      const cancellationController =
        cancellationControllerRef.current ?? createJobCancellationController();

      cancellationControllerRef.current = cancellationController;

      return runFetchVideosJob(
        trigger,
        (nextProgress) => {
          setProgress(nextProgress);
        },
        () => cancellationController.isCancelled(),
      );
    },
    onSettled: () => {
      cancellationControllerRef.current = null;
      setIsCancelling(false);
      void queryClient.invalidateQueries();
    },
  });

  const cancel = () => {
    if (!mutation.isPending || isCancelling) {
      return;
    }

    setIsCancelling(true);
    cancellationControllerRef.current?.cancel();
  };

  useEffect(() => {
    if (!mutation.isPending && progress !== null) {
      setProgress(null);
    }
  }, [mutation.isPending, progress]);

  return { ...mutation, cancel, isCancelling, progress };
}
