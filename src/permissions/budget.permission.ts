import { usePermissionStore } from '@/stores/permission/permission.store';
import { computed } from 'vue';
import { PermissionCodes } from './permission.codes';

export function useBudgetPermission() {
    const permissionStore = usePermissionStore();

    const canViewBudget = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_BUDGET));

    return { canViewBudget };
}
