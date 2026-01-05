import { useAuthStore } from '@/stores/auth/auth.store';
import { usePermissionStore } from '@/stores/permission/permission.store';
import type { Directive } from 'vue';

export const vPermission: Directive = {
    mounted(el, binding) {
        const permissionStore = usePermissionStore();
        const authStore = useAuthStore();
        // Admin bypass
        // if (authStore.user?.is_admin) return;

        const required = binding.value;
        const hasPermission = Array.isArray(required) ? required.some((p) => permissionStore.hasPermission(p)) : permissionStore.hasPermission(required);

        if (!hasPermission) {
            el.remove();
        }
    }
};
