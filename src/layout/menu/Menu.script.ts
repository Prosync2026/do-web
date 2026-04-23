import { PermissionCodes } from '@/permissions';
import { usePermissionStore } from '@/stores/permission/permission.store';
import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';
import type { MenuItemType } from '@/types/sidebar.type';
import { computed, defineComponent, onMounted, ref, markRaw } from 'vue';
import { PhHouse, PhChartBar, PhTicket, PhTag, PhShoppingCart, PhBook, PhWrench, PhCar } from '@phosphor-icons/vue';
import MenuItem from './MenuItem.vue';

export default defineComponent({
    components: { MenuItem },
    setup() {
        const userRole = ref<string | null>(null);

        // access permission
        const permissionStore = usePermissionStore();

        const canViewRO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_REQUEST_ORDER));

        const canViewBudget = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_BUDGET));

        const canViewPO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_PURCHASE_ORDER));

        const canViewDelivery = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_DELIVERY_ORDER));

        // update the badge count
        const roStore = useRequestOrderStore();

        const loadUserRole = () => {
            try {
                const user = localStorage.getItem('user');
                if (user) userRole.value = JSON.parse(user).role;
            } catch (error) {
                console.error('Error loading user role:', error);
            }
        };

        // reactive menu with badge using pendingCount
        const fullMenuModel = computed<MenuItemType[]>(() => [
            {
                items: [
                    { label: 'Dashboard', icon: markRaw(PhHouse), to: '/' },
                    {
                        label: 'Budget',
                        icon: markRaw(PhChartBar),
                        visible: canViewBudget.value,
                        items: [
                            { label: 'Budget List', icon: markRaw(PhTicket), to: '/budget' },
                            { label: 'Budget Change Request', icon: markRaw(PhTag), to: '/bcr' }
                        ]
                    },
                    {
                        label: 'Request Orders',
                        icon: markRaw(PhShoppingCart),
                        to: '/request-orders',
                        badge: roStore.pendingCount,
                        visible: canViewRO.value
                    },
                    {
                        label: 'Purchase Orders',
                        icon: markRaw(PhBook),
                        to: '/purchase-orders',
                        visible: canViewPO.value,
                        badgeIcon: markRaw(PhWrench)
                    },
                    {
                        label: 'Deliveries',
                        icon: markRaw(PhCar),
                        to: '/deliveries',
                        visible: canViewDelivery.value,
                        badgeIcon: markRaw(PhWrench)
                    }
                ]
            }
        ]);

        const model = fullMenuModel;

        onMounted(async () => {
            loadUserRole();
        });

        return { model, canViewRO, canViewBudget, canViewPO, canViewDelivery };
    }
});
