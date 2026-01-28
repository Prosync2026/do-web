import { PermissionCodes } from '@/permissions';
import { requestOrderService } from '@/services/requestOrder.service';
import { usePermissionStore } from '@/stores/permission/permission.store';
import type { MenuItemType } from '@/types/sidebar.type';
import { computed, defineComponent, onMounted, ref } from 'vue';
import MenuItem from './MenuItem.vue';

export default defineComponent({
    components: { MenuItem },
    setup() {
        const userRole = ref<string | null>(null);
        const pendingCount = ref(0);

        // access permission
        const permissionStore = usePermissionStore();

        const canViewRO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_REQUEST_ORDER));

        const canViewBudget = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_BUDGET));

        const canViewPO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_PURCHASE_ORDER));

        const canViewDelivery = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_DELIVERY_ORDER));

        const loadUserRole = () => {
            try {
                const user = localStorage.getItem('user');
                if (user) userRole.value = JSON.parse(user).role;
            } catch (error) {
                console.error('Error loading user role:', error);
            }
        };

        const fetchTotalPending = async () => {
            try {
                const res = await requestOrderService.getRequestOrders({ page: 1, pageSize: 10000 });
                pendingCount.value = res.data.filter((o) => o.Status === 'Submitted' || o.Status === 'Processing').length;
            } catch (err) {
                console.error('Failed to fetch total pending orders', err);
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
                        badge: pendingCount.value,
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
            await fetchTotalPending(); // fetch total pending count for the menu
        });

        return { model, canViewRO, canViewBudget, canViewPO, canViewDelivery };
    }
});
