import { usePermissionStore } from '@/stores/permission/permission.store';
import { computed } from 'vue';
import { PermissionCodes } from './permission.codes';

export function useRequestOrderPermission() {
    const permissionStore = usePermissionStore();

    const canViewRO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_REQUEST_ORDER));

    const canCreateRO = computed(() => permissionStore.hasPermission(PermissionCodes.CREATE_REQUEST_ORDER));

    const canEditRO = computed(() => permissionStore.hasPermission(PermissionCodes.EDIT_REQUEST_ORDER));

    const canApproveRO = computed(() => permissionStore.hasPermission(PermissionCodes.APPROVE_REJECT_REQUEST_ORDER));

    const canDeleteRO = computed(() => permissionStore.hasPermission(PermissionCodes.DELETE_REQUEST_ORDER));

    const canAccessROModule = computed(() => canViewRO.value || canCreateRO.value || canEditRO.value || canApproveRO.value || canDeleteRO.value);

    const canViewPricing = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_PRICING));
    return {
        canViewRO,
        canCreateRO,
        canEditRO,
        canApproveRO,
        canDeleteRO,
        canAccessROModule,
        canViewPricing
    };
}
