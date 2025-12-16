import BaseTab from '@/components/tab/BaseTab.vue';
import ReusableTable from '@/components/table/ReusableTable.vue';
import { useDashboard } from '@/composables/useDashboard';
import { requestOrderService } from '@/services/requestOrder.service';
import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';
import type { TableColumn } from '@/types/table.type';
import { showError } from '@/utils/showNotification.utils';
import { Motion } from '@motionone/vue';
import Badge from 'primevue/badge';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { nextTick } from 'vue';

import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import type { ActionType, Order, RequestOrdersFilters } from '../../types/request-order.type';
import EditRo from './components/modal/EditRo.vue';
import ViewDraftRo from './components/modal/ViewDraftRo.vue';
import ViewRo from './components/modal/ViewRo.vue';
import RoSummary from './components/summary/RoSummary.vue';

export default defineComponent({
    name: 'RequestOrders',
    components: {
        BaseTab,
        Motion,
        ReusableTable,
        RoSummary,
        ViewRo,
        EditRo,
        Badge,
        ViewDraftRo
    },
    setup() {
        const confirm = useConfirm();
        const toast = useToast();
        const store = useRequestOrderStore();

        const draftCount = ref(0);
        const showDraftModal = ref(false);
        const showDetailsModal = ref(false);
        const showEditModal = ref(false);
        const selectedOrder = ref<Order | null>(null);

        const totalCounts = ref({ pending: 0, approved: 0, rejected: 0, totalValue: 0 });

        // badges and totals
        const pendingCount = computed(() => totalCounts.value.pending);
        const approvedCount = computed(() => totalCounts.value.approved);
        const totalValue = computed(() => totalCounts.value.totalValue);

        // User role
        const user = localStorage.getItem('user');
        let userRole = '';
        if (user) {
            try {
                const parsed = JSON.parse(user);
                userRole = parsed.role || '';
            } catch {
                userRole = '';
            }
        }
        const isPurchasingRole = userRole.toLowerCase() === 'purchasing';
        const isPmPdRole = userRole.toLowerCase() === 'pm' || userRole.toLowerCase() === 'pd';
        // const activeTab = ref(isPurchasingRole ? 'all' : 'all');
        const activeTab = ref('all');

        const tabItems = computed(() => {
            if (isPurchasingRole) {
                return [
                    { label: 'All Orders', value: 'all' },
                    { label: 'Pending', value: 'pending', badge: pendingCount.value },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rejected', value: 'rejected' }
                ];
            } else {
                return [
                    { label: 'All Orders', value: 'all' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rejected', value: 'rejected' }
                ];
            }
        });

        // Fetch orders on mount and whenever filters change
        const fetchOrders = async () => {
            await store.fetchOrders();
        };

        // fetch counts for badges
        const fetchTotalCounts = async () => {
            try {
                const res = await requestOrderService.getRequestOrders({ page: 1, pageSize: 10000 });
                const orders = res.data;
                totalCounts.value.pending = orders.filter((o) => o.Status === 'Pending').length;
                totalCounts.value.approved = orders.filter((o) => o.Status === 'Approved').length;
                totalCounts.value.rejected = orders.filter((o) => o.Status === 'Rejected').length;
                totalCounts.value.totalValue = orders.reduce((sum, o) => sum + Number(o.TotalAmount || 0), 0);
            } catch (err) {
                console.error(err);
            }
        };

        onMounted(() => {
            fetchOrders();
            fetchTotalCounts();
        });
        watch(activeTab, (tab) => {
            store.filters.status = tab === 'all' ? '' : tab.charAt(0).toUpperCase() + tab.slice(1);
            store.pagination.page = 1;
            store.fetchOrders();
        });

        const startingIndex = computed(() => {
            return (store.pagination.page - 1) * store.pagination.pageSize;
        });

        const filteredOrders = computed(() =>
            store.orders.map((order, i) => ({
                ...order,
                rowIndex: (store.pagination.page - 1) * store.pagination.pageSize + i + 1
            }))
        );

        // Table config
        const tableColumns = computed<TableColumn[]>(() => {
            const baseActions: ActionType[] = ['view'];
            let actions: ActionType[] = [...baseActions];

            if (isPurchasingRole) {
                actions = [...baseActions, 'delete'];

                return [
                    { field: 'rowIndex', header: '#', sortable: true },
                    { field: 'roNumber', header: 'RO Number', sortable: true },
                    { field: 'requestedBy', header: 'Requested By', sortable: true },
                    { field: 'roDate', header: 'RO Date', sortable: true },
                    { field: 'deliveryDate', header: 'Delivery Date', sortable: true },
                    { field: 'totalAmount', header: 'Total Amount', sortable: true, bodySlot: 'totalAmount' },
                    { field: 'budgetType', header: 'Budget Type', sortable: true, bodySlot: 'budgetType' },
                    { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' },
                    {
                        field: 'actions',
                        header: 'Actions',
                        action: true,
                        actions: (row: Order) => {
                            const rowActions: ActionType[] = ['view'];

                            if (isPurchasingRole) {
                                if (row.status === 'Pending') {
                                    rowActions.push('approve', 'reject', 'edit');
                                }
                                rowActions.push('delete');
                            }

                            if (isPmPdRole) {
                                rowActions.push('edit');
                            }

                            return rowActions;
                        }
                    }
                ];
            }

            if (isPmPdRole) {
                actions = [...actions, 'edit'];
            }

            return [
                { field: 'rowIndex', header: '#', sortable: true },
                { field: 'roNumber', header: 'RO Number', sortable: true },
                { field: 'requestedBy', header: 'Requested By', sortable: true },
                { field: 'roDate', header: 'RO Date', sortable: true },
                { field: 'deliveryDate', header: 'Delivery Date', sortable: true },
                { field: 'totalAmount', header: 'Total Amount', sortable: true, bodySlot: 'totalAmount', visible: false },
                { field: 'budgetType', header: 'Budget Type', sortable: true, bodySlot: 'budgetType' },
                { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' },
                {
                    field: 'actions',
                    header: 'Actions',
                    action: true,
                    actions
                }
            ];
        });

        const tableFilters = computed(() => [
            {
                type: 'select' as const,
                field: 'status',
                placeholder: 'Filter by Status',
                options: [
                    { label: 'All Statuses', value: '' },
                    { label: 'Pending', value: 'Pending' },
                    { label: 'Approved', value: 'Approved' },
                    { label: 'Rejected', value: 'Rejected' }
                ],
                model: store.filters.status
            },
            {
                type: 'select' as const,
                field: 'budgetType',
                placeholder: 'Filter by Budget Type',
                options: [
                    { label: 'All Budget Types', value: '' },
                    { label: 'Budgeted', value: 'Budgeted' },
                    { label: 'Unbudgeted', value: 'Unbudgeted' }
                ],
                model: store.filters.budgetType
            }
        ]);

        function getStatusSeverity(status: string): string {
            switch (status) {
                case 'Approved':
                    return 'success';
                case 'Rejected':
                    return 'danger';
                case 'Pending':
                    return 'warning';
                default:
                    return 'info';
            }
        }

        async function openOrderDetails(order: Order): Promise<void> {
            const fullOrder = await store.fetchOrderById(String(order.id));
            if (fullOrder) {
                selectedOrder.value = { ...fullOrder };
                await nextTick();
                showDetailsModal.value = true;
            }
        }

        function editOrder(order: Order): void {
            showEditModal.value = true;
            selectedOrder.value = null;

            store
                .fetchOrderById(String(order.id))
                .then((fullOrder) => {
                    if (fullOrder) {
                        selectedOrder.value = fullOrder;
                    }
                })
                .catch((err) => {
                    console.error('Failed to fetch full order', err);
                });
        }

        async function deleteOrder(order: Order): Promise<void> {
            confirm.require({
                message: `Are you sure you want to delete order ${order.roNumber}?`,
                header: 'Confirm Delete',
                icon: 'pi pi-exclamation-triangle',
                acceptClass: 'p-button-danger',
                rejectClass: 'p-button-secondary',
                acceptLabel: 'Yes, Delete',
                rejectLabel: 'Cancel',

                accept: async () => {
                    try {
                        await requestOrderService.deleteRequestOrder(order.id);

                        toast.add({
                            severity: 'success',
                            summary: 'Order Deleted',
                            detail: `Order ${order.id} deleted successfully.`,
                            life: 3000
                        });

                        await store.fetchOrders(); // refresh list
                    } catch (error) {
                        showError(error, `Failed to delete order ${order.id}.`);
                    } finally {
                        confirm.close();
                    }
                },

                reject: () => {
                    toast.add({
                        severity: 'info',
                        summary: 'Cancelled',
                        detail: 'Order deletion cancelled.',
                        life: 2500
                    });
                    confirm.close();
                }
            });
        }

        function handleSaveOrder(formData: Partial<Order>): void {
            if (selectedOrder.value) {
                Object.assign(selectedOrder.value, formData);
                store.fetchOrders();
                showEditModal.value = false;
            }
        }

        function handleApproveFromModal(order: Order): void {
            if (order) {
                order.status = 'Approved';
                store.fetchOrders();
                showDetailsModal.value = false;
            }
        }

        function handleRejectFromModal(order: Order): void {
            if (order) {
                order.status = 'Rejected';
                store.fetchOrders();
                showDetailsModal.value = false;
            }
        }

        function approveOrder(order: Order) {
            confirm.require({
                message: `Approve RO ${order.roNumber}?`,
                header: 'Confirm Approval',
                icon: 'pi pi-check-circle',
                acceptClass: 'p-button-success',
                acceptLabel: 'Yes, Approve',
                rejectLabel: 'Cancel',
                accept: () => {
                    confirm.close();

                    (async () => {
                        try {
                            await requestOrderService.approveRejectRequestOrder(order.id, 'Approved');
                            toast.add({
                                severity: 'success',
                                summary: 'Approved',
                                detail: 'Request order approved.',
                                life: 3000
                            });
                            await store.fetchOrders();
                        } catch (err) {
                            showError(err);
                        }
                    })();
                }
            });
        }

        function rejectOrder(order: Order) {
            confirm.require({
                message: `Reject RO ${order.roNumber}?`,
                header: 'Confirm Rejection',
                icon: 'pi pi-times-circle',
                acceptClass: 'p-button-danger',
                acceptLabel: 'Yes, Reject',
                rejectLabel: 'Cancel',
                accept: () => {
                    confirm.close();

                    (async () => {
                        try {
                            await requestOrderService.approveRejectRequestOrder(order.id, 'Rejected');
                            toast.add({
                                severity: 'warn',
                                summary: 'Rejected',
                                detail: 'Request order rejected.',
                                life: 3000
                            });
                            await store.fetchOrders();
                        } catch (err) {
                            showError(err);
                        }
                    })();
                }
            });
        }

        function handleActionClick(type: 'edit' | 'view' | 'delete' | 'approve' | 'reject', rowData: Order): void {
            switch (type) {
                case 'view':
                    openOrderDetails(rowData);
                    break;
                case 'edit':
                    editOrder(rowData);
                    break;
                case 'delete':
                    deleteOrder(rowData);
                    break;
                case 'approve':
                    approveOrder(rowData);
                    break;
                case 'reject':
                    rejectOrder(rowData);
                    break;
            }
        }

        function handlePageChange(page: number): void {
            store.pagination.page = page;
            store.fetchOrders();
        }

        function handlePageSizeChange(pageSize: number): void {
            store.pagination.pageSize = pageSize;
            store.pagination.page = 1; // Reset to page 1 when changing page size
            store.fetchOrders();
        }

        function handleFilterChange(filters: RequestOrdersFilters): void {
            store.filters.status = filters.status ?? '';
            store.filters.budgetType = filters.budgetType ?? '';
            store.filters.search = filters.search ?? '';
            store.filters.startDate = filters.startDate ?? '';
            store.filters.endDate = filters.endDate ?? '';
            store.pagination.page = 1;
            store.fetchOrders();
        }

        // Search
        const filters = ref({
            global: { value: null as string | null, matchMode: 'contains' }
        });
        const search = ref('');

        const handleSearch = (value: string) => {
            search.value = value;
            filters.value.global.value = value;
        };

        return {
            activeTab,
            tabItems,
            store,
            filteredOrders,
            getStatusSeverity,
            pendingCount,
            approvedCount,
            totalValue,
            isPurchasingRole,
            isPmPdRole,
            showDetailsModal,
            showEditModal,
            selectedOrder,
            openOrderDetails,
            editOrder,
            handleSaveOrder,
            handleApproveFromModal,
            handleRejectFromModal,
            tableColumns,
            tableFilters,
            handleActionClick,
            handleFilterChange,
            showDraftModal,
            draftCount,
            confirm: useConfirm(),
            toast: useToast(),
            handlePageChange,
            handlePageSizeChange,
            startingIndex,
            totalCounts,
            useDashboard,
            handleSearch,
            onSearchWrapper: handleSearch
        };
    }
});
