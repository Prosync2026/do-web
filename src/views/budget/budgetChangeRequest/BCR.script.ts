import ReusableTable from '@/components/table/ReusableTable.vue';
import { usePermission } from '@/permissions/budgetChangeRequest.permission';
import { PermissionCodes } from '@/permissions/permission.codes';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BudgetChangeRequest } from '@/types/budgetChangeRequest.type';
import type { CardItem } from '@/types/card.type';
import type { TableColumn } from '@/types/table.type';
import { formatDate } from '@/utils/dateHelper';
import Badge from 'primevue/badge';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
export default defineComponent({
    name: 'BudgetChangeRequest',
    components: { ReusableTable, Badge },
    setup() {
        const BudgetChangeRequestSummaryData = computed<CardItem[]>(() => {
            const reviewCount = budgetChangeRequestData.value.filter((item) => item.Status === 'Under Review').length;
            const pendingReviewCount = budgetChangeRequestData.value.filter((item) => item.Status === 'Pending Review').length;
            const approvedItems = budgetChangeRequestData.value.filter((item) => item.Status === 'Approved');
            const approvedCount = approvedItems.length;

            const totalApprovedValue = approvedItems.reduce((sum, item) => sum + (item.TotalAmount || 0), 0);
            const formattedTotal = totalApprovedValue.toLocaleString(undefined, { minimumFractionDigits: 2 });

            return [
                { title: 'Under Review', value: reviewCount.toString(), description: 'Review in progress', icon: 'pi pi-exclamation-triangle', color: 'red' },
                { title: 'Pending Review', value: pendingReviewCount.toString(), description: 'Ready for review', icon: 'pi pi-comment', color: 'orange' },
                { title: 'Approved', value: approvedCount.toString(), description: 'Ready for implement', icon: 'pi pi-check-circle', color: 'green' },
                { title: 'Total Value', value: `$ ${formattedTotal}`, description: 'Estimated budget impact', icon: 'pi pi-chart-line', color: 'blue' }
            ];
        });
        const budgetCRStore = useBudgetChangeRequestStore();
        onMounted(async () => {
            await budgetCRStore.fetchBudgetChangesRequestList();
        });

        const { hasPermission } = usePermission();

        const canCreateBCR = hasPermission(PermissionCodes.CREATE_BCR);

        const canEditBCR = hasPermission(PermissionCodes.EDIT_BCR);

        const budgetChangeRequestData = computed(() => {
            return budgetCRStore.budgetChangeRequestList.map((item) => {
                const actions = ['view'];

                if (canEditBCR.value && item.Status !== 'Approved') {
                    actions.push('edit');
                }

                return {
                    ...item,
                    actions
                };
            });
        });

        const searchTerm = ref<string>('');
        const activeFilters = ref<Record<string, string | number | boolean> | null>(null);

        const extraFilters = [
            {
                type: 'select',
                field: 'status',
                placeholder: 'All Status',
                options: [
                    { label: 'All Status', value: '' },
                    { label: 'Draft', value: 'Draft' },
                    { label: 'Under Review', value: 'Under Review' },
                    { label: 'Approved', value: 'Approved' },
                    { label: 'Rejected', value: 'Rejected' }
                ]
            }
        ];

        const showCommentModal = ref(false);
        const selectedRequestNo = ref<string | null>(null);

        const filteredRequests = computed(() => {
            return budgetChangeRequestData.value.filter((r) => {
                const matchSearch = !budgetCRStore.filters.search || r.DocNo.toLowerCase().includes(budgetCRStore.filters.search.toLowerCase());

                const statusFilter = budgetCRStore.filters.status;
                const matchStatus = !statusFilter ? true : r.Status === statusFilter;

                return matchSearch && matchStatus;
            });
        });

        const paginatedRequests = computed(() => {
            const start = (budgetCRStore.pagination.page - 1) * budgetCRStore.pagination.pageSize;
            const end = start + budgetCRStore.pagination.pageSize;
            return filteredRequests.value.slice(start, end);
        });
        const tableColumns = computed<TableColumn[]>(() => [
            { field: 'rowIndex', header: '#' },
            { field: 'DocNo', header: 'BCR No' },
            { field: 'RequestedBy', header: 'Requested By' },
            {
                field: 'RequestDate',
                header: 'Date Requested',
                body: (rowData: BudgetChangeRequest) => formatDate(rowData.RequestDate)
            },
            { field: 'Status', header: 'Status', bodySlot: 'status', style: 'min-width: 120px; width: 120px' },
            { field: 'Remark', header: 'Remark' },
            { field: 'TotalAmount', header: 'Variance Amount', bodySlot: 'TotalAmount' },
            { field: 'actions', header: 'Actions', action: true }
        ]);

        function getStatusSeverity(Status: string) {
            switch (Status) {
                case 'Approved':
                    return 'success';
                case 'Rejected':
                    return 'danger';
                case 'Under Review':
                    return 'warn';
                default:
                    return 'info';
            }
        }

        function handlePageChange(page: number) {
            budgetCRStore.setPage(page);
        }

        function handlePageSizeChange(size: number) {
            budgetCRStore.setPageSize(size);
        }

        function handleSearch(value: string) {
            budgetCRStore.handleSearch(value);
        }

        function handleFilterChange(filters: Record<string, any>) {
            budgetCRStore.handleFilterChange(filters);
        }

        const router = useRouter();

        function handleActionClick(type: 'edit' | 'view', rowData: BudgetChangeRequest) {
            if (type === 'edit') {
                router.push(`/bcr/edit/${rowData.Id}`);
            } else if (type === 'view') {
                router.push(`/bcr/view/${rowData.Id}`);
            }
        }

        const startingIndex = computed(() => {
            return (budgetCRStore.pagination.page - 1) * budgetCRStore.pagination.pageSize;
        });

        const numberedRequests = computed(() => {
            return paginatedRequests.value.map((item, index) => ({
                ...item,
                rowIndex: startingIndex.value + index + 1
            }));
        });

        return {
            budgetChangeRequestData,
            filteredRequests,
            searchTerm,
            activeFilters,
            extraFilters,
            tableColumns,
            canCreateBCR,
            showCommentModal,
            selectedRequestNo,
            BudgetChangeRequestSummaryData,
            paginatedRequests,
            pagination: budgetCRStore.pagination,
            budgetCRStore,
            numberedRequests,
            getStatusSeverity,
            handleSearch,
            handleFilterChange,
            handleActionClick,
            handlePageChange,
            handlePageSizeChange
        };
    }
});
