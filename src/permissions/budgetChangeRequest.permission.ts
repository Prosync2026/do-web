import { usePermissionStore } from '@/stores/permission/permission.store';
import { computed } from 'vue';
import type { PermissionCode } from './permission.codes';

export function usePermission() {
    const permissionStore = usePermissionStore();

    const hasPermission = (code: PermissionCode) => {
        return computed(() => permissionStore.hasPermission(code));
    };

    return {
        hasPermission
    };
}
