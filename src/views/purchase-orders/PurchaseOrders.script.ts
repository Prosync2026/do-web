import type { TableColumn } from '@/types/table.type';
import Tag from 'primevue/tag';
import { computed, defineComponent, onMounted, ref } from 'vue';

import POSummaryData from '@/components/summaryCard/SummaryCard.vue';
import BaseTabUnderLine from '@/components/tab/BaseTabUnderLine.vue';
import ReusableTable from '@/components/table/ReusableTable.vue';
import router from '@/router';
import { useProjectStore } from '@/stores/project/project.store';
import { usePurchaseOrderStore } from '@/stores/purchase-order/purchaseOrder.store';
import type { CardItem } from '@/types/card.type';
import type { PurchaseOrderWithStatus } from '@/types/purchase.type';
import { Motion } from '@motionone/vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

// permission composable
import { usePurchaseOrderPermission } from '@/permissions';

export default defineComponent({
    name: 'PurchaseOrders',
    components: {
        Tag,
        POSummaryData,
        ReusableTable,
        Button,
        Motion,
        BaseTabUnderLine,
        ProgressSpinner
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

        const poSummaryData = ref<CardItem[]>([]);

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

                poSummaryData.value = [
                    { title: 'Pending POs', value: pendingList.value.length.toString(), description: 'No items delivered yet', icon: 'pi pi-clock', color: 'blue' },
                    { title: 'Partially Delivered', value: partiallyList.value.length.toString(), description: 'Some items delivered', icon: 'pi pi-exclamation-triangle', color: 'orange' },
                    { title: 'Completed', value: completedList.value.length.toString(), description: 'All items delivered', icon: 'pi pi-check-circle', color: 'green' },
                    { title: 'Total POs', value: store.purchaseOrders.length.toString(), description: 'Delivery orders created', icon: 'pi pi-book', color: 'gray' }
                ];
            } finally {
                isLoading.value = false;
            }
        };

        /* =========================
         * COLUMNS
         * ========================= */
        const pendingListColumn = computed<TableColumn[]>(() => {
            const cols: TableColumn[] = [
                { field: 'no', header: '#', sortable: false },
                { field: 'poNumber', header: 'PO Number', sortable: true }
            ];

            if (isPurchasingRole) {
                cols.push({ field: 'projectName', header: 'Project', sortable: true });
            }

            cols.push(
                { field: 'supplier', header: 'Supplier', sortable: true },
                { field: 'poDate', header: 'Date', sortable: true },
                { field: 'totalAmount', header: 'Total Amount', sortable: true, bodySlot: 'totalAmount' },
                { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' },
                { field: 'action', header: 'Action', sortable: false, bodySlot: 'action' }
            );

            // hide pricing column if no permission
            if (!canViewPricing?.value) {
                return cols.filter((col) => col.field !== 'totalAmount');
            }

            return cols;
        });

        const partiallyListColumn: TableColumn[] = [
            { field: 'no', header: '#', sortable: false },
            { field: 'poNumber', header: 'PO Number', sortable: true },
            { field: 'supplier', header: 'Supplier', sortable: true },
            { field: 'poDate', header: 'Date', sortable: true },
            { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' }
        ];

        const completedListColumn: TableColumn[] = [
            { field: 'no', header: '#', sortable: false },
            { field: 'doNumber', header: 'DO Number', sortable: true },
            { field: 'poNumber', header: 'PO Number', sortable: true },
            { field: 'poDate', header: 'Date', sortable: true },
            { field: 'receivedBy', header: 'Received By', sortable: true },
            { field: 'discrepancyType', header: 'Discrepancy Type', sortable: true, bodySlot: 'discrepancyType' },
            { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' }
        ];

        /* =========================
         * TABS & ACTION
         * ========================= */
        const tabItems = [
            { value: '0', label: 'Pending' },
            { value: '1', label: 'Partial Delivery' },
            { value: '2', label: 'Completed' }
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
            store.filters.projectId = filters.projectId ?? '';
            store.pagination.page = 1;
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

            poSummaryData,

            pagination,
            currentSortField,
            currentSortOrder,

            onSearchWrapper,
            handleSortChange,
            handleTabChange,

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
