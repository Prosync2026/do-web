import type { TableColumn } from '@/types/table.type';
import { computed, defineComponent, onMounted, ref } from 'vue';

import router from '@/router';
import { useProjectStore } from '@/stores/project/project.store';
import { usePurchaseOrderStore } from '@/stores/purchase-order/purchaseOrder.store';
import type { PurchaseOrderWithStatus } from '@/types/purchase.type';
import { Motion } from '@motionone/vue';
import { ProButton, ProCard, ProTable, ProTag, ProTabs } from '@prosync_solutions/ui';
import { PhBookOpen, PhCheckCircle, PhClock, PhWarning } from '@phosphor-icons/vue';

// permission composable
import { usePurchaseOrderPermission } from '@/permissions';

export default defineComponent({
    name: 'PurchaseOrders',
    components: {
        Motion,
        ProTable,
        ProTag,
        ProButton,
        ProCard,
        ProTabs,
        PhClock,
        PhWarning,
        PhCheckCircle,
        PhBookOpen,
    },
    setup() {
        const isLoading = ref(true);
        const store = usePurchaseOrderStore();
        const projectStore = useProjectStore();

        // User role
        type UserRole = 'PM' | 'PD' | 'PURC';
        const getUserRole = (): UserRole | null => {
            const user = localStorage.getItem('user');
            if (!user) return null;
            try {
                const parsed = JSON.parse(user);
                const role = parsed.user_project_role_code;
                if (role === 'PM' || role === 'PD' || role === 'PURC') {
                    return role;
                }
                return null;
            } catch {
                return null;
            }
        };

        const userRole = getUserRole();
        const isPurchasingRole = userRole === 'PURC';

        // pricing permission
        const { canViewPricing } = usePurchaseOrderPermission();

        // Lists from DB
        const pendingList = ref<PurchaseOrderWithStatus[]>([]);
        const partiallyList = ref<PurchaseOrderWithStatus[]>([]);
        const completedList = ref<PurchaseOrderWithStatus[]>([]);



        /* =========================
         * SEARCH (SERVER SIDE)
         * ========================= */
        const onSearchWrapper = (value: string) => {
            store.handleSearch(value);
            loadData();
        };

        /* =========================
         * SORTING (SERVER SIDE)
         * ========================= */
        const handleSortChange = ({ field, order }: { field: string; order: number }) => {
            if (!field || order === 0) {
                store.setSorting('', '');
                loadData();
                return;
            }

            const mapFieldToApi: Record<string, string> = {
                poNumber: 'DocNo',
                poDate: 'PoDate',
                supplier: 'SupplierId',
                totalAmount: 'TotalAmount',
                status: 'Status',
                createdAt: 'CreatedAt'
            };

            const sortOrder = order === 1 ? 'asc' : 'desc';
            store.setSorting(mapFieldToApi[field] || 'CreatedAt', sortOrder);
            loadData();
        };

        const currentSortField = computed(() => {
            const reverseMap: Record<string, string> = {
                DocNo: 'poNumber',
                PoDate: 'poDate',
                SupplierId: 'supplier',
                TotalAmount: 'totalAmount',
                Status: 'status',
                CreatedAt: 'createdAt'
            };
            return reverseMap[store.sorting.sortBy] || '';
        });

        const currentSortOrder = computed(() => {
            if (!store.sorting.sortBy) return 0;
            return store.sorting.sortOrder === 'asc' ? 1 : -1;
        });

        /* =========================
         * PAGINATION
         * ========================= */
        const pagination = computed(() => store.pagination);

        const startingIndex = computed(() => {
            return (store.pagination.page - 1) * store.pagination.pageSize;
        });

        const pendingListWithNo = computed(() =>
            pendingList.value.map((item, i) => ({
                ...item,
                no: startingIndex.value + i + 1
            }))
        );

        const partiallyListWithNo = computed(() =>
            partiallyList.value.map((item, i) => ({
                ...item,
                no: startingIndex.value + i + 1
            }))
        );

        const completedListWithNo = computed(() =>
            completedList.value.map((item, i) => ({
                ...item,
                no: startingIndex.value + i + 1
            }))
        );

        /* =========================
         * LOAD DATA
         * ========================= */
        const loadData = async () => {
            isLoading.value = true;
            try {
                await store.fetchPurchaseOrders();

                const list: PurchaseOrderWithStatus[] = store.purchaseOrders.map((po) => ({
                    ...po,
                    poNumber: po.DocNo,
                    supplier: po.SupplierId?.toString() || '',
                    totalAmount:
                        po.PurchaseOrderItems?.reduce((sum, item) => {
                            const qty = typeof item.Quantity === 'string' ? Number(item.Quantity) : item.Quantity;
                            return sum + qty * (item.Price || 0);
                        }, 0) || 0,
                    status: po.Status || 'Pending'
                }));

                pendingList.value = list.filter((po) => ['pending', 'created'].includes(po.status.toLowerCase()));
                partiallyList.value = list.filter((po) => po.status.toLowerCase() === 'partially delivered');
                completedList.value = list.filter((po) => po.status.toLowerCase() === 'completed');


            } finally {
                isLoading.value = false;
            }
        };

        /* =========================
         * COLUMNS (ProTable format: { key, label })
         * ========================= */
        const pendingListColumn = computed(() => {
            const cols: any[] = [
                { key: 'no', label: '#' },
                { key: 'poNumber', label: 'PO Number', sortable: true }
            ];

            if (isPurchasingRole) {
                cols.push({ key: 'projectName', label: 'Project', sortable: true });
            }

            cols.push(
                { key: 'supplier', label: 'Supplier', sortable: true },
                { key: 'poDate', label: 'Date', sortable: true }
            );

            if (canViewPricing?.value) {
                cols.push({ key: 'totalAmount', label: 'Total Amount', sortable: true });
            }

            cols.push(
                { key: 'status', label: 'Status', sortable: true },
                { key: 'actions', label: 'Actions', actions: true }
            );

            return cols;
        });

        const partiallyListColumn = computed(() => {
            const cols: any[] = [
                { key: 'no', label: '#' },
                { key: 'poNumber', label: 'PO Number', sortable: true }
            ];

            if (isPurchasingRole) {
                cols.push({ key: 'projectName', label: 'Project', sortable: true });
            }

            cols.push(
                { key: 'supplier', label: 'Supplier', sortable: true },
                { key: 'poDate', label: 'Date', sortable: true },
                { key: 'status', label: 'Status', sortable: true }
            );

            return cols;
        });

        const completedListColumn = computed(() => {
            const cols: any[] = [
                { key: 'no', label: '#' },
                { key: 'doNumber', label: 'DO Number', sortable: true },
                { key: 'poNumber', label: 'PO Number', sortable: true }
            ];

            if (isPurchasingRole) {
                cols.push({ key: 'projectName', label: 'Project', sortable: true });
            }

            cols.push(
                { key: 'poDate', label: 'Date', sortable: true },
                { key: 'receivedBy', label: 'Received By', sortable: true },
                { key: 'discrepancyType', label: 'Discrepancy Type', sortable: true },
                { key: 'status', label: 'Status', sortable: true }
            );

            return cols;
        });

        /* =========================
         * TABS & ACTION
         * ========================= */
        const tabItems = [
            { key: '0', label: 'Pending' },
            { key: '1', label: 'Partial Delivery' },
            { key: '2', label: 'Completed' }
        ];

        const activeTab = ref('0');

        const handleTabChange = (newTab: string) => {
            activeTab.value = newTab;
            loadData();
        };

        const tableFilters = computed(() => {
            const filters: any[] = [];

            if (isPurchasingRole) {
                filters.push({
                    type: 'select',
                    field: 'projectId',
                    placeholder: 'Project',
                    options: [{ label: 'All Projects', value: '' }, ...projectStore.projectOptions],
                    model: store.filters.projectId
                });
            }

            return filters;
        });

        const viewPO = (po: PurchaseOrderWithStatus & { no?: number }) => {
            router.push({
                name: 'ViewDetailsPO',
                params: { poNumber: po.poNumber },
                query: { id: po.Id }
            });
        };

        const handleFilterChange = (filters: any) => {
            store.filters.projectId = (filters.projectId as string) ?? '';
            store.pagination.page = 1;
            loadData();
        };

        const handleUpdatePagination = (newPagination: any) => {
            if (store.pagination.page === newPagination.page && store.pagination.pageSize === newPagination.pageSize) return;
            store.pagination.page = newPagination.page;
            store.pagination.pageSize = newPagination.pageSize;
            loadData();
        };

        onMounted(() => {
            loadData();
            projectStore.fetchProjects();
        });

        return {
            isLoading,

            pendingList: pendingListWithNo,
            partiallyList: partiallyListWithNo,
            completedList: completedListWithNo,

            pagination,
            currentSortField,
            currentSortOrder,

            onSearchWrapper,
            handleSortChange,
            handleTabChange,
            handleUpdatePagination,

            pendingListColumn,
            partiallyListColumn,
            completedListColumn,

            activeTab,
            tabItems,

            viewPO,
            tableFilters,
            handleFilterChange
        };
    }
});
