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

import { useRequestOrderPermission } from '@/permissions';
import { USER_ROLE_TO_APPROVAL_ROLE } from '@/utils/approvalRole.util';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import type { ActionType, Order, RequestOrdersFilters } from '../../types/request-order.type';
import EditRo from './components/modal/EditRo.vue';
import ViewDraftRo from './components/modal/ViewDraftRo.vue';
import ViewRo from './components/modal/ViewRo.vue';
import RoSummary from './components/summary/RoSummary.vue';
// reject modal
import RejectRo from './components/modal/RejectRo.vue';

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
        ViewDraftRo,
        RejectRo
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

        const totalCounts = ref({ pending: 0, approved: 0, rejected: 0, submitted: 0, totalValue: 0, totalApprovedValue: 0 });

        // badges and totals
        const pendingCount = computed(() => totalCounts.value.pending);
        const approvedCount = computed(() => totalCounts.value.approved);
        const totalValue = computed(() => totalCounts.value.totalValue);
        const totalApprovedValue = computed(() => totalCounts.value.totalApprovedValue);

        // ref for  budget type and date range
        const selectedBudgetType = ref('');
        const startDate = ref('');
        const endDate = ref('');

        function applyFilters() {
            handleFilterChange({
                status: store.filters.status,
                budgetType: selectedBudgetType.value,
                startDate: startDate.value,
                endDate: endDate.value,
                search: store.filters.search
            });
        }

        // User role
        type UserRole = 'PM' | 'PD' | 'PURC';
        type MaybeUserRole = UserRole | null;

        const getUserRole = (): MaybeUserRole => {
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

        // permission
        const { canViewRO, canCreateRO, canEditRO, canApproveRO, canDeleteRO, canViewPricing, canAccessROModule } = useRequestOrderPermission();
        const isPurchasingRole = userRole === 'PURC';
        const isPmPdRole = userRole === 'PM' || userRole === 'PD';
        // const activeTab = ref(isPurchasingRole ? 'all' : 'all');
        const activeTab = ref('all');

        const tabItems = computed(() => {
            return [
                { label: 'All Orders', value: 'all' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'Processing', value: 'processing', badge: pendingCount.value },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' }
            ];
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

                totalCounts.value.pending = orders.filter((o) => o.Status === 'Processing').length;
                totalCounts.value.submitted = orders.filter((o) => o.Status === 'Submitted').length;
                totalCounts.value.approved = orders.filter((o) => o.Status === 'Approved').length;
                totalCounts.value.rejected = orders.filter((o) => o.Status === 'Rejected').length;

                totalCounts.value.totalValue = orders.reduce((sum, o) => sum + Number(o.TotalAmount || 0), 0);

                totalCounts.value.totalApprovedValue = res.totalApprovedValue || 0;
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

        // Search
        const onSearchWrapper = (value: string) => {
            store.handleSearch(value);
        };

        // handle sorting change
        const handleSortChange = ({ field, order }: { field: string; order: number }) => {
            // Handle reset (third click removes sort)
            if (order === 0 || !field) {
                store.setSorting('', '');
                return;
            }

            const mapFieldToApi: Record<string, string> = {
                roNumber: 'DocNo',
                roDate: 'RequestOrderDate',
                status: 'Status',
                totalAmount: 'TotalAmount',
                budgetType: 'PrType',
                requestedAt: 'CreatedAt'
            };

            // trigger a server fetch with new sort params
            store.setSorting(mapFieldToApi[field] || 'CreatedAt', order === 1 ? 'asc' : 'desc');
        };

        // Create computed properties to convert API field names back to display field names
        const currentSortField = computed(() => {
            const reverseMap: Record<string, string> = {
                DocNo: 'roNumber',
                RequestOrderDate: 'roDate',
                Status: 'status',
                TotalAmount: 'totalAmount',
                PrType: 'budgetType',
                CreatedAt: 'requestedAt'
            };

            return reverseMap[store.sortField] || '';
        });

        const currentSortOrder = computed(() => {
            if (!store.sortField) return 0; // no sort
            return store.sortOrder === 'asc' ? 1 : -1;
        });

        const filteredOrders = computed(() =>
            store.orders.map((order, i) => ({
                ...order,

                approvalProgress: order.approvalProgress ?? [],
                isHighValue: order.approvalFlowType === 'HIGH_VALUE',

                rowIndex: (store.pagination.page - 1) * store.pagination.pageSize + i + 1
            }))
        );

        const tableColumns = computed<TableColumn[]>(() => {
            const columns: TableColumn[] = [
                { field: 'rowIndex', header: '#', sortable: true },
                { field: 'roNumber', header: 'RO Number', sortable: true },
                { field: 'requestedBy', header: 'Requested By', sortable: true },
                { field: 'roDate', header: 'RO Date', sortable: true },
                { field: 'deliveryDate', header: 'Delivery Date', sortable: true }
            ];

            // only show pricing to dedicated users
            if (canViewPricing.value) {
                columns.push({
                    field: 'totalAmount',
                    header: 'Total Amount',
                    sortable: true,
                    bodySlot: 'totalAmount'
                });
            }

            columns.push(
                { field: 'budgetType', header: 'Budget Type', sortable: true, bodySlot: 'budgetType' },
                {
                    field: 'approvalProgress',
                    header: 'Approval Status',
                    bodySlot: 'approvalStatus'
                },
                { field: 'status', header: 'Status', sortable: true, bodySlot: 'status' },
                {
                    field: 'actions',
                    header: 'Actions',
                    action: true,
                    actions: (row: Order) => {
                        const actions: ActionType[] = [];

                        if (canViewRO.value) actions.push('view');

                        if (canEditRO.value && isPurchasingRole && row.currentApprovalStage === 'PURCH') {
                            actions.push('edit');
                        }

                        if (canApproveRow(row)) {
                            actions.push('approve', 'reject');
                        }

                        if (canDeleteRO.value) actions.push('delete');

                        return actions;
                    }
                }
            );

            return columns;
        });

        const tableFilters = computed(() => [
            {
                type: 'select' as const,
                field: 'budgetType',
                placeholder: 'Budget',
                options: [
                    { label: 'All Type', value: '' },
                    { label: 'Budgeted', value: 'Budgeted' },
                    { label: 'NonBudgeted', value: 'NonBudgeted' }
                ],
                model: store.filters.budgetType
            },
            {
                type: 'date',
                field: 'startDate',
                placeholder: 'Start Date'
            },
            {
                type: 'date',
                field: 'endDate',
                placeholder: 'End Date'
            }
        ]);

        function getApprovalDotClass(status: string) {
            switch (status) {
                case 'Approved':
                    return 'bg-green-500';
                case 'Rejected':
                    return 'bg-red-500';
                default:
                    return 'bg-yellow-400';
            }
        }

        function getStatusSeverity(status: string): string {
            switch (status) {
                case 'Approved':
                    return 'success';
                case 'Rejected':
                    return 'danger';
                case 'Processing':
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

        function handleCloseModal(): void {
            showDetailsModal.value = false;
            selectedOrder.value = null;
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
                handleCloseModal();
            }
        }

        function handleRejectFromModal(order: Order): void {
            if (order) {
                order.status = 'Rejected';
                store.fetchOrders();
                handleCloseModal();
            }
        }

        // approve
        function canApproveRow(row: Order) {
            if (!canApproveRO.value) return false;
            if (!row.currentApprovalStage) return false;
            if (!userRole) return false;

            const approvableStatuses: Array<Order['status']> = ['Submitted', 'Processing'];

            const approvalRole = USER_ROLE_TO_APPROVAL_ROLE[userRole];

            return approvableStatuses.includes(row.status) && row.currentApprovalStage === approvalRole;
        }

        function approveOrder(order: Order) {
            confirm.require({
                message: `Approve RO ${order.roNumber}?`,
                header: 'Confirm Approval',
                icon: 'pi pi-check-circle',
                acceptClass: 'p-button-success',
                acceptLabel: 'Yes, Approve',
                rejectLabel: 'Cancel',
                accept: async () => {
                    try {
                        if (!userRole) {
                            toast.add({
                                severity: 'warn',
                                summary: 'No Role',
                                detail: 'User role is not defined',
                                life: 3000
                            });
                            return;
                        }

                        console.log('Approving order:', order.id, 'by user role:', userRole);

                        await requestOrderService.processROApproval(order.id, 'Approved', userRole);

                        toast.add({
                            severity: 'success',
                            summary: 'Approved',
                            detail: 'Request order approved.',
                            life: 3000
                        });

                        await store.fetchOrders();
                        confirm.close();
                    } catch (err: any) {
                        const errorDetail = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to approve';

                        toast.add({
                            severity: 'warn',
                            summary: 'Cannot Approve',
                            detail: errorDetail,
                            life: 3000
                        });
                        confirm.close();
                    }
                },
                reject: () => {
                    confirm.close();
                    toast.add({
                        severity: 'info',
                        summary: 'Cancelled',
                        detail: 'Approve cancelled.',
                        life: 2500
                    });
                }
            });
        }
        // Rejection modal state
        const showRejectModal = ref(false);
        const currentRejectOrder = ref<Order | null>(null);

        function rejectOrder(order: Order) {
            currentRejectOrder.value = order;
            showRejectModal.value = true;
        }

        async function onRejectConfirmed(remark: string) {
            if (!currentRejectOrder.value) return;

            try {
                if (!userRole) {
                    toast.add({
                        severity: 'warn',
                        summary: 'No Role',
                        detail: 'User role is not defined',
                        life: 3000
                    });
                    return;
                }
                await requestOrderService.processROApproval(currentRejectOrder.value.id, 'Rejected', userRole, remark);

                toast.add({
                    severity: 'warn',
                    summary: 'Rejected',
                    detail: 'Request order rejected.',
                    life: 3000
                });

                await store.fetchOrders();
                showRejectModal.value = false;
                currentRejectOrder.value = null;
            } catch (err: any) {
                const errorDetail = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to reject';

                toast.add({
                    severity: 'error',
                    summary: 'Cannot Reject',
                    detail: errorDetail,
                    life: 3000
                });
            }
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
            handleCloseModal,
            canDeleteRO,
            canEditRO,
            canApproveRO,
            canCreateRO,
            canViewRO,
            getApprovalDotClass,
            handleSortChange,
            onSearchWrapper,
            currentSortField,
            currentSortOrder,
            applyFilters,
            selectedBudgetType,
            startDate,
            endDate,
            showRejectModal,
            onRejectConfirmed,
            currentRejectOrder,
            totalApprovedValue,
            canViewPricing
        };
    }
});
