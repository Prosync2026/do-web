import { usePermissionStore } from '@/stores/permission/permission.store';
import { useAuthStore } from '@/stores/auth/auth.store';
import type { BootstrapModule } from '../types';

export const permissionBootstrap: BootstrapModule = {
    name: 'permission',

    async init() {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) {
            // Not logged in yet, skip fetching permissions.
            return;
        }
        const store = usePermissionStore();
        await store.fetchPermissions();
    }
};
