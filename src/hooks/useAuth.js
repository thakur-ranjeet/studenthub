import { useSyncExternalStore } from 'react';
import { authStore } from '../auth/store.js';

export const ROLE_LABEL = { ROLE_ADMIN: 'Admin', ROLE_STUDENT: 'Student' };

export function useAuth() {
  const { user, notice } = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
  return {
    user,
    notice,
    isAdmin: user?.role === 'ROLE_ADMIN',
    roleLabel: ROLE_LABEL[user?.role] || 'User',
    signOut: () => authStore.signOut(),
  };
}
