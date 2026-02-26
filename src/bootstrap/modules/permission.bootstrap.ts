import { usePermissionStore } from '@/stores/permission/permission.store';
import type { BootstrapModule } from '../types';

export const permissionBootstrap: BootstrapModule = {
    name: 'permission',

    async init() {
        const store = usePermissionStore();
        await store.fetchPermissions();
    }
};
