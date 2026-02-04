import type { TableColumn } from '@/types/table.type';
import Tag from 'primevue/tag';
import { computed, defineComponent, onMounted, ref } from 'vue';

import POSummaryData from '@/components/summaryCard/SummaryCard.vue';
import BaseTabUnderLine from '@/components/tab/BaseTabUnderLine.vue';
import ReusableTable from '@/components/table/ReusableTable.vue';
import { usePurchaseOrderPermission } from '@/permissions';
import router from '@/router';
import { usePurchaseOrderStore } from '@/stores/purchase-order/purchaseOrder.store';
import type { CardItem } from '@/types/card.type';
import type { PurchaseOrderWithStatus } from '@/types/purchase.type';
import { Motion } from '@motionone/vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';

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
        const store = usePurchaseOrderStore();
        const { canViewPricing } = usePurchaseOrderPermission();

        // PAGINATION & SORTING
        const pagination = computed(() => store.pagination);
        const currentSortField = computed(() => store.sorting.sortBy);
        const currentSortOrder = computed(() => (store.sorting.sortOrder === 'asc' ? 1 : -1));

        // LIST WITH INDEX
        const listWithNo = computed<PurchaseOrderWithStatus[]>(() => {
            const start = (store.pagination.page - 1) * store.pagination.pageSize;
            return store.purchaseOrders.map((po, i) => ({
                ...po,
                no: start + i + 1,
                poNumber: po.DocNo,
                supplier: po.SupplierId?.toString() || '',
                totalAmount:
                    po.PurchaseOrderItems?.reduce((sum, item) => {
                        const qty = typeof item.Quantity === 'string' ? Number(item.Quantity) : item.Quantity;
                        return sum + qty * (item.Price || 0);
                    }, 0) || 0,
                status: po.Status || 'Created'
            }));
        });

        // SEARCH
        const onSearchWrapper = (value: string) => {
            store.handleSearch(value);
            store.fetchPurchaseOrders(); // fetch directly
        };

        // SORTING
        const handleSortChange = ({ field, order }: { field: string; order: number }) => {
            if (!field || order === 0) {
                store.setSorting('', '');
                store.fetchPurchaseOrders();
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
            store.fetchPurchaseOrders();
        };

        // TABS
        const TAB_STATUS_MAP: Record<string, string> = {
            '0': 'Created',
            '1': 'Ongoing',
            '2': 'Completed',
            '3': 'Cancelled'
        };

        const activeTab = ref('0');

        const handleTabChange = (newTab: string) => {
            activeTab.value = newTab;
            store.setStatus(TAB_STATUS_MAP[newTab]);
        };

        // COLUMNS
        const pendingListColumn = computed<TableColumn[]>(() => {
            const cols: TableColumn[] = [
                { field: 'no', header: '#', sortable: false },
                { field: 'poNumber', header: 'PO Number', sortable: true },
                { field: 'supplier', header: 'Supplier', sortable: true },
                { field: 'poDate', header: 'Date', sortable: true },
                { field: 'totalAmount', header: 'Total Amount', sortable: true, bodySlot: 'totalAmount' },
                { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' },
                { field: 'action', header: 'Action', sortable: false, bodySlot: 'action' }
            ];

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

        // ACTIONS
        const viewPO = (po: PurchaseOrderWithStatus & { no?: number }) => {
            router.push({
                name: 'ViewDetailsPO',
                params: { poNumber: po.poNumber },
                query: { id: po.Id }
            });
        };

        function formatPOStatus(status?: string) {
            if (!status) return 'Pending';
            return status === 'Created' ? 'Pending' : status;
        }

        function poStatusSeverity(status?: string) {
            switch (status) {
                case 'Created':
                    return 'warn';
                case 'Completed':
                    return 'success';
                case 'Ongoing':
                    return 'warning';
                case 'Cancelled':
                    return 'danger';
                default:
                    return 'info';
            }
        }

        // ON MOUNT
        onMounted(() => {
            store.setStatus('Created'); // default = Pending tab
        });

        // FILTERED LIST BASED ON ACTIVE TAB
        const filteredList = computed<PurchaseOrderWithStatus[]>(() => {
            const status = TAB_STATUS_MAP[activeTab.value];

            const start = (store.pagination.page - 1) * store.pagination.pageSize;

            return store.purchaseOrders
                .filter((po) => po.Status === status)
                .map((po, i) => ({
                    ...po,
                    no: start + i + 1,
                    poNumber: po.DocNo,
                    supplier: po.SupplierId?.toString() || '',
                    totalAmount:
                        po.PurchaseOrderItems?.reduce((sum, item) => {
                            const qty = typeof item.Quantity === 'string' ? Number(item.Quantity) : item.Quantity;
                            return sum + qty * (item.Price || 0);
                        }, 0) || 0,
                    status: po.Status
                }));
        });

        // posummary data
        const poSummaryData = computed<CardItem[]>(() => {
            const pending = store.purchaseOrders.filter((po) => po.Status === 'Created' || po.Status === 'Pending').length;

            const partial = store.purchaseOrders.filter((po) => po.Status === 'Ongoing').length;

            const completed = store.purchaseOrders.filter((po) => po.Status === 'Completed').length;

            return [
                {
                    title: 'Pending POs',
                    value: pending.toString(),
                    description: 'No items delivered yet',
                    icon: 'pi pi-clock',
                    color: 'blue'
                },
                {
                    title: 'Partially Delivered',
                    value: partial.toString(),
                    description: 'Some items delivered',
                    icon: 'pi pi-exclamation-triangle',
                    color: 'orange'
                },
                {
                    title: 'Completed',
                    value: completed.toString(),
                    description: 'All items delivered',
                    icon: 'pi pi-check-circle',
                    color: 'green'
                },
                {
                    title: 'Total POs',
                    value: store.purchaseOrders.length.toString(),
                    description: 'Delivery orders created',
                    icon: 'pi pi-book',
                    color: 'gray'
                }
            ];
        });

        return {
            isLoading: store.loading,
            pagination,
            currentSortField,
            currentSortOrder,
            listWithNo,

            onSearchWrapper,
            handleSortChange,
            handleTabChange,
            filteredList,

            formatPOStatus,
            poStatusSeverity,

            pendingListColumn,
            partiallyListColumn,
            completedListColumn,
            poSummaryData,

            activeTab,
            tabItems: [
                { value: '0', label: 'Pending' },
                { value: '1', label: 'Ongoing' },
                { value: '2', label: 'Completed' }
            ],

            viewPO
        };
    }
});
