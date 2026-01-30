import { usePermissionStore } from '@/stores/permission/permission.store';
import { computed } from 'vue';
import { PermissionCodes } from './permission.codes';

export function usePurchaseOrderPermission() {
    const permissionStore = usePermissionStore();

    const canViewPurchaseOrder = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_PURCHASE_ORDER));
    const canViewPricing = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_PRICING));

    return { canViewPurchaseOrder, canViewPricing, permissionStore };
}
