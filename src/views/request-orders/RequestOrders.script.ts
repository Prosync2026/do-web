
import { useDashboard } from '@/composables/useDashboard';
import { requestOrderService } from '@/services/requestOrder.service';
import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';
import { showError } from '@/utils/showNotification.utils';
import { Motion } from '@motionone/vue';
import Badge from 'primevue/badge';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { nextTick } from 'vue';

import { useRequestOrderPermission } from '@/permissions';
import { useProjectStore } from '@/stores/project/project.store';
import { USER_ROLE_TO_APPROVAL_ROLE } from '@/utils/approvalRole.util';
import { formatCurrency } from '@/utils/format.utils';
import { PhCheck, PhDotsThreeVertical, PhEye, PhPencilSimple, PhTrash, PhX, PhArrowsLeftRight } from '@phosphor-icons/vue';
import { ProButton, ProCard, ProIconButton, ProInput, ProMenu, ProPageHeader, ProSelect, ProTable, ProTabs, ProTag, ProDatePicker } from '@prosync_solutions/ui';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import type { Order } from '../../types/request-order.type';
import ApproveRo from './components/modal/ApproveRo.vue';
import EditRo from './components/modal/EditRo.vue';
import RejectRo from './components/modal/RejectRo.vue';
import ViewDraftRo from './components/modal/ViewDraftRo.vue';
import ViewRo from './components/modal/ViewRo.vue';
import RoSummary from './components/summary/RoSummary.vue';

export default defineComponent({
    name: 'RequestOrders',
    components: {
        ProTabs,
        Motion,
        ProTable,
        ProPageHeader,
        ProButton,
        ProCard,
        ProInput,
        ProTag,
        ProSelect,
        ProMenu,
        ProIconButton,
        RoSummary,
        ViewRo,
        EditRo,
        Badge,
        ViewDraftRo,
        RejectRo,
        ApproveRo,
        PhDotsThreeVertical,
        PhArrowsLeftRight,
        ProDatePicker
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
        const submittedCount = computed(() => totalCounts.value.submitted);
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
                search: store.filters.search,
                projectId: store.filters.projectId
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

        // project store
        const projectStore = useProjectStore();

        const tabItems = computed(() => {
            return [
                { label: 'All Orders', key: 'all' },
                { label: 'Pending', key: 'submitted', badge: submittedCount.value },
                { label: 'Processing', key: 'processing', badge: pendingCount.value },
                { label: 'Approved', key: 'approved' },
                { label: 'Rejected', key: 'rejected' }
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
            projectStore.fetchProjects();
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

        const tableColumns = computed(() => {
            const columns: any[] = [
                { key: 'rowIndex', label: '#', sortable: true },
                { key: 'roNumber', label: 'RO Number', sortable: true }
            ];
            if (isPurchasingRole) {
                columns.push({
                    key: 'projectName',
                    label: 'Project',
                    sortable: true
                });
            }
            columns.push(
                { key: 'requestedBy', label: 'Requested By', sortable: true },
                { key: 'roDate', label: 'RO Date', sortable: true },
                { key: 'deliveryDate', label: 'Delivery Date', sortable: true }
            );

            // only show pricing to dedicated users
            if (canViewPricing.value) {
                columns.push({
                    key: 'totalAmount',
                    label: 'Total Amount',
                    sortable: true
                });
            }

            columns.push(
                { key: 'budgetType', label: 'Budget Type', sortable: true },
                { key: 'approvalProgress', label: 'Approval Status' },
                { key: 'status', label: 'Status', sortable: true },
                { key: 'actions', label: 'Actions', actions: true }
            );

            return columns;
        });

        // Removed tableFilters as filters will be handled purely in template

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
                handleCloseModal();
                approveOrder(order);
            }
        }

        function handleRejectFromModal(order: Order): void {
            if (order) {
                handleCloseModal();
                rejectOrder(order);
            }
        }

        // approve
        function canApproveRow(row: Order) {
            const approvableStatuses: Array<string> = ['Submitted', 'Processing', 'Pending'];
            if (!approvableStatuses.includes(row.status as string)) return false;

            if (row.currentApprovalStage && userRole) {
                const approvalRole = USER_ROLE_TO_APPROVAL_ROLE[userRole];
                if (row.currentApprovalStage === approvalRole) return true;
                
                // If a stage explicitly dictates another role, strictly deny bypasses
                return false;
            }

            if (canApproveRO.value) return true;

            // Legacy fallback ONLY if the record has no currentApprovalStage populated
            if (isPurchasingRole && ((row.status as string) === 'Pending' || row.status === 'Submitted')) {
                return true;
            }

            return false;
        }

        // Rejection modal state
        const showRejectModal = ref(false);
        const currentRejectOrder = ref<Order | null>(null);

        function rejectOrder(order: Order) {
            currentRejectOrder.value = order;
            showDetailsModal.value = false;
            showRejectModal.value = true;
        }

        // Approval modal state
        const showApproveModal = ref(false);
        const currentApproveOrder = ref<Order | null>(null);

        function approveOrder(order: Order) {
            currentApproveOrder.value = order;
            showDetailsModal.value = false;
            showApproveModal.value = true;
        }

        async function onApproveConfirmed() {
            if (!currentApproveOrder.value) return;

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

                await requestOrderService.processROApproval(currentApproveOrder.value.id, 'Approved', userRole);

                toast.add({
                    severity: 'success',
                    summary: 'Approved',
                    detail: 'Request order approved.',
                    life: 3000
                });

                await store.fetchOrders();
                showApproveModal.value = false;
                currentApproveOrder.value = null;
            } catch (err: any) {
                const errorDetail = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to approve';

                toast.add({
                    severity: 'warn',
                    summary: 'Cannot Approve',
                    detail: errorDetail,
                    life: 3000
                });
            }
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

        const getAvailableActions = (row: Order) => {
            const actions: any[] = [];
            
            if (canViewRO.value) {
                actions.push({
                    label: 'View',
                    icon: PhEye,
                    tier: 'default',
                    variant: 'secondary',
                    onClick: () => handleActionClick('view', row)
                });
            }
            
            if (canEditRO.value && ['Pending', 'Submitted', 'Processing'].includes(row.status as string)) {
                actions.push({
                    label: 'Edit',
                    icon: PhPencilSimple,
                    tier: 'default',
                    variant: 'secondary',
                    onClick: () => handleActionClick('edit', row)
                });
            }

            if (canApproveRow(row)) {
                actions.push({
                    label: 'Approve',
                    icon: PhCheck,
                    tier: 'default',
                    variant: 'secondary',
                    iconClass: 'text-green-600 dark:text-green-400',
                    onClick: () => handleActionClick('approve', row)
                });
                actions.push({
                    label: 'Reject',
                    icon: PhX,
                    tier: 'destructive',
                    variant: 'danger',
                    iconClass: 'text-red-500',
                    onClick: () => handleActionClick('reject', row)
                });
            }

            if (canDeleteRO.value) {
                actions.push({
                    label: 'Delete',
                    icon: PhTrash,
                    tier: 'destructive',
                    variant: 'danger',
                    iconClass: 'text-red-500',
                    onClick: () => handleActionClick('delete', row)
                });
            }
            
            return actions;
        };

        function handlePageChange(page: number): void {
            store.pagination.page = page;
            store.fetchOrders();
        }

        function handlePageSizeChange(pageSize: number): void {
            store.pagination.pageSize = pageSize;
            store.pagination.page = 1; // Reset to page 1 when changing page size
            store.fetchOrders();
        }

        function handleFilterChange(filters?: any): void {
            if (filters) {
                store.filters.status = filters.status ?? store.filters.status;
                store.filters.budgetType = filters.budgetType ?? store.filters.budgetType;
                store.filters.search = filters.search ?? store.filters.search;
                store.filters.startDate = filters.startDate ?? store.filters.startDate;
                store.filters.endDate = filters.endDate ?? store.filters.endDate;
                store.filters.projectId = (filters.projectId as string) ?? store.filters.projectId;
            }
            store.pagination.page = 1;
            store.fetchOrders();
        }

        const handleUpdatePagination = async (newPagination: any) => {
            if (store.pagination.page === newPagination.page && store.pagination.pageSize === newPagination.pageSize) return;
            store.pagination.page = newPagination.page;
            store.pagination.pageSize = newPagination.pageSize;
            store.fetchOrders();
        };

        return {
            activeTab,
            tabItems,
            store,
            filteredOrders,
            getStatusSeverity,
            pendingCount,
            submittedCount,
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
            showApproveModal,
            onApproveConfirmed,
            currentApproveOrder,
            totalApprovedValue,
            canViewPricing,
            formatCurrency,
            handleUpdatePagination,
            canApproveRow,
            projectStore,
            getAvailableActions
        };
    }
});
