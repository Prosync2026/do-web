import { PermissionCodes } from '@/permissions';
import { usePermissionStore } from '@/stores/permission/permission.store';
import { PhBook, PhChartBar, PhHouse, PhTag, PhTicket, PhTruck, PhWrench } from '@phosphor-icons/vue';
import { computed } from 'vue';
import CartWithBadge from '@/components/icons/CartWithBadge.vue';
import type { Component } from 'vue';

export interface NavItem {
    label: string;
    icon: Component | string;
    to?: string;
    visible?: boolean;
    badgeIcon?: Component;
    children?: NavItem[];
}

export interface BottomNavItem {
    label: string;
    to?: string;
    icon: Component;
    badge?: boolean | number;
    onClick?: (e?: any) => void;
}

export function useNavigation() {
    const permissionStore = usePermissionStore();

    const canViewRO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_REQUEST_ORDER));
    const canViewBudget = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_BUDGET));
    const canViewPO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_PURCHASE_ORDER));
    const canViewDelivery = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_DELIVERY_ORDER));

    // For Sidebar (Desktop)
    const navItems = computed<NavItem[]>(() =>
        [
            { label: 'Dashboard', icon: PhHouse, to: '/' },
            {
                label: 'Budget',
                icon: PhChartBar,
                visible: canViewBudget.value,
                children: [
                    { label: 'Budget List', icon: PhTicket, to: '/budget' },
                    { label: 'Budget Change Request', icon: PhTag, to: '/bcr' }
                ]
            },
            {
                label: 'Request Orders',
                icon: CartWithBadge,
                to: '/request-orders',
                visible: canViewRO.value
            },
            {
                label: 'Purchase Orders',
                icon: PhBook,
                to: '/purchase-orders',
                visible: canViewPO.value,
                badgeIcon: PhWrench
            },
            {
                label: 'Deliveries',
                icon: PhTruck,
                to: '/deliveries',
                visible: canViewDelivery.value,
                badgeIcon: PhWrench
            }
        ].filter((item) => item.visible !== false)
    );

    return {
        canViewRO,
        canViewBudget,
        canViewPO,
        canViewDelivery,
        navItems
    };
}
