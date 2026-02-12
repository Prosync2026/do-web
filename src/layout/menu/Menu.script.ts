import { PermissionCodes } from '@/permissions';
import { requestOrderService } from '@/services/requestOrder.service';
import { usePermissionStore } from '@/stores/permission/permission.store';
import type { MenuItemType } from '@/types/sidebar.type';
import { computed, defineComponent, onMounted, ref } from 'vue';
import MenuItem from './MenuItem.vue';
import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';

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
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' },
                    {
                        label: 'Budget',
                        icon: 'pi pi-fw pi-chart-bar',
                        visible: canViewBudget.value,
                        items: [
                            { label: 'Budget List', icon: 'pi pi-fw pi-ticket', to: '/budget' },
                            { label: 'Budget Change Request', icon: 'pi pi-fw pi-tags', to: '/bcr' }
                        ]
                    },
                    {
                        label: 'Request Orders',
                        icon: 'pi pi-fw pi-shopping-cart',
                        to: '/request-orders',
                        badge: roStore.pendingCount,
                        visible: canViewRO.value
                    },
                    {
                        label: 'Purchase Orders',
                        icon: 'pi pi-fw pi-book',
                        to: '/purchase-orders',
                        visible: canViewPO.value,
                        badgeIcon: 'pi pi-fw pi-wrench'
                    },
                    {
                        label: 'Deliveries',
                        icon: 'pi pi-fw pi-car',
                        to: '/deliveries',
                        visible: canViewDelivery.value,
                        badgeIcon: 'pi pi-fw pi-wrench'
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
