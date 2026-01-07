import { usePermissionStore } from '@/stores/permission/permission.store';
import { computed } from 'vue';
import { PermissionCodes } from './permission.codes';

export function useDeliveryPermission() {
    const permissionStore = usePermissionStore();

    const canViewDelivery = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_DELIVERY_ORDER));

    return { canViewDelivery };
}
