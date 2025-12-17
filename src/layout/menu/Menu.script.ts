import { requestOrderService } from '@/services/requestOrder.service';
import type { MenuItemType } from '@/types/sidebar.type';
import { computed, defineComponent, onMounted, ref } from 'vue';
import MenuItem from './MenuItem.vue';

export default defineComponent({
    components: { MenuItem },
    setup() {
        const userRole = ref<string | null>(null);
        const pendingCount = ref(0);

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
                        items: [
                            { label: 'Budget List', icon: 'pi pi-fw pi-ticket', to: '/budget' },
                            { label: 'Budget Change Request', icon: 'pi pi-fw pi-tags', to: '/bcr' }
                        ]
                    },
                    {
                        label: 'Request Orders',
                        icon: 'pi pi-fw pi-shopping-cart',
                        to: '/request-orders',
                        badge: pendingCount.value
                    },
                    { label: 'Purchase Orders', icon: 'pi pi-fw pi-book', to: '/purchase-orders' },
                    { label: 'Deliveries', icon: 'pi pi-fw pi-car', to: '/deliveries' }
                ]
            }
        ]);

        const rolePermissions = {
            purchasing: ['Dashboard', 'Request Orders', 'Purchase Orders'],
            site: ['Dashboard', 'Budget', 'Request Orders', 'Purchase Orders', 'Deliveries'],
            pm: ['Dashboard', 'Budget', 'Request Orders', 'Purchase Orders', 'Deliveries']
        };

        const filterMenuByRole = (menuItems: MenuItemType[], allowedItems: string[]) =>
            menuItems
                .map((item) => {
                    if (item.separator) return item;
                    const isAllowed = allowedItems.includes(item.label || '');
                    if (!isAllowed && !item.items) return { ...item, visible: false };
                    if (item.items) {
                        const filteredItems = item.items.filter((sub) => allowedItems.includes(sub.label || ''));
                        if (filteredItems.length === 0 && !isAllowed) return { ...item, visible: false };
                        return { ...item, items: filteredItems, visible: filteredItems.length > 0 || isAllowed };
                    }
                    return { ...item, visible: isAllowed };
                })
                .filter((item) => item.visible !== false || item.separator);

        const model = computed<MenuItemType[]>(() => {
            if (!userRole.value) return fullMenuModel.value;
            const allowedItems = rolePermissions[userRole.value.toLowerCase() as keyof typeof rolePermissions];
            if (!allowedItems) return fullMenuModel.value;
            return filterMenuByRole(fullMenuModel.value, allowedItems);
        });

        onMounted(async () => {
            loadUserRole();
            await fetchTotalPending(); // fetch total pending count for the menu
        });

        return { model };
    }
});
