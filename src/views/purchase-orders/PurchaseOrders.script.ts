import type { TableColumn } from '@/types/table.type';
import Tag from 'primevue/tag';
import { computed, defineComponent, onMounted, ref } from 'vue';

import POSummaryData from '@/components/summaryCard/SummaryCard.vue';
import BaseTabUnderLine from '@/components/tab/BaseTabUnderLine.vue';
import ReusableTable from '@/components/table/ReusableTable.vue';
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
        const isLoading = ref(true);
        const store = usePurchaseOrderStore();

        // Lists from DB
        const pendingList = ref<PurchaseOrderWithStatus[]>([]);
        const partiallyList = ref<PurchaseOrderWithStatus[]>([]);
        const completedList = ref<PurchaseOrderWithStatus[]>([]);

        const poSummaryData = ref<CardItem[]>([]);

        // Search
        const filters = ref({
            global: { value: null as string | null, matchMode: 'contains' }
        });
        const search = ref('');

        const handleSearch = (value: string) => {
            search.value = value;
            filters.value.global.value = value;
        };

        /** -------------------------
         *  PAGINATION SUPPORT
         * ------------------------*/
        const pagination = ref({
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0
        });

        const startingIndex = computed(() => {
            return (pagination.value.page - 1) * pagination.value.pageSize;
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

        /** -------------------------
         *  LOAD DATA + PATCH STATUS
         * ------------------------*/
        const loadData = async () => {
            isLoading.value = true;
            try {
                await store.fetchPurchaseOrders();

                const purchaseOrdersWithStatus: PurchaseOrderWithStatus[] = store.purchaseOrders.map((po) => ({
                    ...po,
                    poNumber: po.DocNo,
                    supplier: po.SupplierId?.toString() || '',
                    totalAmount:
                        po.PurchaseOrderItems?.reduce((sum, item) => {
                            const quantity = typeof item.Quantity === 'string' ? parseFloat(item.Quantity) : item.Quantity;
                            const price = item.Price || 0;
                            return sum + quantity * price;
                        }, 0) || 0,
                    status: po.Status || 'Pending' || 'Created'
                }));

                pendingList.value = purchaseOrdersWithStatus.filter((po) => po.status.toLowerCase() === 'pending' || po.status.toLowerCase() === 'created');
                partiallyList.value = purchaseOrdersWithStatus.filter((po) => po.status.toLowerCase() === 'partially delivered');
                completedList.value = purchaseOrdersWithStatus.filter((po) => po.status.toLowerCase() === 'completed');

                pagination.value.total = pendingList.value.length;
                pagination.value.totalPages = Math.ceil(pendingList.value.length / pagination.value.pageSize);

                poSummaryData.value = [
                    {
                        title: 'Pending POs',
                        value: pendingList.value.length.toString(),
                        description: 'No items delivered yet',
                        icon: 'pi pi-clock',
                        color: 'blue'
                    },
                    {
                        title: 'Partially Delivered',
                        value: partiallyList.value.length.toString(),
                        description: 'Some items delivered',
                        icon: 'pi pi-exclamation-triangle',
                        color: 'orange'
                    },
                    {
                        title: 'Completed',
                        value: completedList.value.length.toString(),
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
            } catch (error) {
                console.error('Error loading purchase orders:', error);
            } finally {
                isLoading.value = false;
            }
        };

        /** -------------------------
         *  PAGINATION HANDLERS
         * ------------------------*/
        function handlePageChange(page: number) {
            pagination.value.page = page;
        }

        function handlePageSizeChange(pageSize: number) {
            pagination.value.pageSize = pageSize;
            pagination.value.page = 1;
        }

        /** -------------------------
         *  COLUMNS
         * ------------------------*/
        const pendingListColumn: TableColumn[] = [
            { field: 'no', header: '#', sortable: false, bodySlot: 'no' },
            { field: 'poNumber', header: 'PO Number', sortable: true },
            { field: 'supplier', header: 'Supplier', sortable: false },
            { field: 'poDate', header: 'Date', sortable: true },
            {
                field: 'totalAmount',
                header: 'Total Amount',
                sortable: true,
                bodySlot: 'totalAmount'
            },
            { field: 'status', header: 'Status', sortable: false, bodySlot: 'status' },
            { field: 'action', header: 'Action', bodySlot: 'action', sortable: false }
        ];

        const partiallyListColumn: TableColumn[] = [
            { field: 'no', header: '#', sortable: false, bodySlot: 'no' },
            { field: 'poNumber', header: 'PO Number', sortable: true },
            { field: 'supplier', header: 'Supplier', sortable: true },
            { field: 'poDate', header: 'Date', sortable: true },
            { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' }
        ];

        const completedListColumn: TableColumn[] = [
            { field: 'no', header: '#', sortable: false, bodySlot: 'no' },
            { field: 'doNumber', header: 'DO Number', sortable: true },
            { field: 'poNumber', header: 'PO Number', sortable: true },
            { field: 'poDate', header: 'Date', sortable: true },
            { field: 'receivedBy', header: 'Received By', sortable: true },
            {
                field: 'discrepancyType',
                header: 'Discrepancy Type',
                sortable: true,
                bodySlot: 'discrepancyType'
            },
            { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' }
        ];

        /** -------------------------
         *  TABS
         * ------------------------*/
        const tabItems = [
            { value: '0', label: 'Pending' },
            { value: '1', label: 'Partial Delivery', badge: partiallyList.value.length },
            { value: '2', label: 'Completed' }
        ];

        const activeTab = ref('0');

        /** -------------------------
         *  ACTIONS
         * ------------------------*/
        const viewPO = (po: PurchaseOrderWithStatus & { no?: number }) => {
            router.push({
                name: 'ViewDetailsPO',
                params: { poNumber: po.poNumber },
                query: { id: po.Id }
            });
        };

        onMounted(() => {
            void loadData();
        });

        return {
            isLoading,
            pendingList: pendingListWithNo,
            partiallyList: partiallyListWithNo,
            completedList: completedListWithNo,
            poSummaryData,
            filters,
            search,
            pagination,
            onSearchWrapper: handleSearch,
            pendingListColumn,
            partiallyListColumn,
            completedListColumn,
            activeTab,
            tabItems,
            viewPO,
            loadData,
            handlePageChange,
            handlePageSizeChange
        };
    }
});
