import { useMutation } from '@tanstack/react-query';

import { syncSubscriptions } from './sync';

export function useSyncSubscriptions() {
  return useMutation({ mutationFn: syncSubscriptions });
}
