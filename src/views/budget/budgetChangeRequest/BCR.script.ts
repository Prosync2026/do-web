import SummaryCard from '@/components/summaryCard/SummaryCard.vue';
import { usePermission } from '@/permissions/budgetChangeRequest.permission';
import { PermissionCodes } from '@/permissions/permission.codes';
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BudgetChangeRequest } from '@/types/budgetChangeRequest.type';
import type { CardItem } from '@/types/card.type';
import type { TableColumn } from '@/types/table.type';
import { buildApprovalFlow } from '@/utils/bcrApprovalFlow.util';
import { formatDate } from '@/utils/dateHelper';
import { Motion } from '@motionone/vue';
import { ProButton, ProCard, ProInput, ProSelect, ProTable, ProTag } from '@prosync_solutions/ui';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { PhWarningCircle, PhChatText, PhCheckCircle, PhTrendUp, PhCaretRight, PhPencil } from '@phosphor-icons/vue';

export default defineComponent({
    name: 'BudgetChangeRequest',
    components: { SummaryCard, Motion, ProTag, ProButton, ProTable, ProInput, ProSelect, ProCard, PhCaretRight, PhPencil },
    setup() {
        const { hasPermission } = usePermission();

        const canCreateBCR = hasPermission(PermissionCodes.CREATE_BCR);
        const canEditBCR = hasPermission(PermissionCodes.EDIT_BCR);
        const canViewPricing = hasPermission(PermissionCodes.VIEW_PRICING);

        const BudgetChangeRequestSummaryData = computed<CardItem[]>(() => {
            const reviewCount = budgetChangeRequestData.value.filter((item) => item.Status === 'Under Review').length;
            const pendingReviewCount = budgetChangeRequestData.value.filter((item) => item.Status === 'Pending Review').length;
            const approvedItems = budgetChangeRequestData.value.filter((item) => item.Status === 'Approved');
            const approvedCount = approvedItems.length;

            const totalApprovedValue = approvedItems.reduce((sum, item) => sum + (item.TotalAmount || 0), 0);
            const formattedTotal = totalApprovedValue.toLocaleString(undefined, { minimumFractionDigits: 2 });

            const cards: CardItem[] = [
                { title: 'Under Review', value: reviewCount.toString(), description: 'Waiting CM Review', icon: PhWarningCircle, color: 'bg-surface-warn' },
                { title: 'Pending Review', value: pendingReviewCount.toString(), description: 'CM review done. Ready for PM/PD/Manager.', icon: PhChatText, color: 'bg-surface-info' },
                { title: 'Approved', value: approvedCount.toString(), description: 'Ready for implement', icon: PhCheckCircle, color: 'bg-surface-success' }
            ];

            if (canViewPricing.value) {
                cards.push({
                    title: 'Total Value',
                    value: `$ ${formattedTotal}`,
                    description: 'Estimated budget impact',
                    icon: PhTrendUp,
                    color: 'bg-surface-primary'
                });
            }

            return cards;
        });

        const bcrSummaryCol = computed(() => (canViewPricing.value ? 4 : 3));

        const budgetCRStore = useBudgetChangeRequestStore();
        onMounted(() => {
            budgetCRStore.fetchBudgetChangesRequestList();
        });

        const budgetChangeRequestData = computed(() => {
            const startIndex = (budgetCRStore.pagination.page - 1) * budgetCRStore.pagination.pageSize;

            return budgetCRStore.budgetChangeRequestList.map((item, index) => {
                const actions = ['view'];

                if (canEditBCR.value && item.Status !== 'Approved') {
                    actions.push('edit');
                }

                return {
                    ...item,
                    approvalFlow: buildApprovalFlow(item.budget_change_recommendations || [], item.budget_change_reviews || []),
                    rowIndex: startIndex + index + 1,
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

        const tableColumns = computed<TableColumn[]>(() => {
            const columns: TableColumn[] = [
                { field: 'rowIndex', header: '#' },
                { field: 'DocNo', header: 'BCR No', sortable: true },
                { field: 'RequestedBy', header: 'Requested By', sortable: true },
                {
                    field: 'RequestDate',
                    header: 'Date Requested',
                    sortable: true,
                    body: (rowData: BudgetChangeRequest) => formatDate(rowData.RequestDate)
                },
                {
                    field: 'Status',
                    header: 'Status',
                    sortable: true,
                    bodySlot: 'status',
                    style: 'min-width: 120px; width: 120px'
                },

                { field: 'Remark', header: 'Remark' }
            ];

            if (canViewPricing.value) {
                columns.push({
                    field: 'TotalAmount',
                    header: 'Variance Amount',
                    sortable: true,
                    bodySlot: 'TotalAmount'
                });
            }
            columns.push({
                field: 'approvalFlow',
                header: 'Approval Flow',
                bodySlot: 'approvalFlow',
                style: 'min-width: 320px'
            });

            columns.push({ field: 'actions', header: 'Actions', action: true });
            return columns;
        });

        const statusSeverity: Record<string, string> = {
            approved: 'success',
            acknowledged: 'success',
            rejected: 'danger',
            pending: 'warn'
        };

        // ProTable columns
        const proTableColumns = computed(() => {
            const cols: any[] = [
                { key: 'DocNo', label: 'BCR No', sortable: true },
                { key: 'RequestedBy', label: 'Requested By', sortable: true },
                { key: 'RequestDate', label: 'Date Requested', sortable: true, format: 'date' },
                {
                    key: 'Status',
                    label: 'Status',
                    sortable: true,
                    tagRules: [
                        { value: 'Under Review', variant: 'warn' },
                        { value: 'Pending Review', variant: 'info' },
                        { value: 'Approved', variant: 'success' },
                        { value: 'Rejected', variant: 'error' },
                        { value: 'Draft', variant: 'secondary' }
                    ]
                },
                { key: 'Remark', label: 'Remark' }
            ];

            if (canViewPricing.value) {
                cols.push({ key: 'TotalAmount', label: 'Variance Amount', sortable: true });
            }

            cols.push({ key: 'approvalFlow', label: 'Approval Flow' });
            cols.push({ key: 'actions', label: '', actions: true });

            return cols;
        });

        const bcrSearchTerm = ref('');
        const bcrStatusFilter = ref('');

        const statusFilterOptions = [
            { label: 'All Status', value: '' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Under Review', value: 'Under Review' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' }
        ];

        const pageSizeOptions = [
            { label: '10', value: 10 },
            { label: '25', value: 25 },
            { label: '50', value: 50 },
            { label: '100', value: 100 }
        ];

        function handleProTableSort(event: { key: string; direction: 'asc' | 'desc' | null }) {
            if (!event.key || !event.direction) {
                handleSortChange({ field: '', order: 0 });
            } else {
                handleSortChange({ field: event.key, order: event.direction === 'asc' ? 1 : -1 });
            }
        }

        function handleProTablePaginationUpdate(newPagination: any) {
            if (newPagination.page !== budgetCRStore.pagination.page) {
                handlePageChange(newPagination.page);
            }
        }

        function handleBcrSearch() {
            handleSearch(bcrSearchTerm.value);
        }

        function handleBcrStatusFilterChange(value: string) {
            bcrStatusFilter.value = value;
            handleFilterChange({ status: value });
        }

        function handleBcrActionClick(row: any) {
            // ProTable action slot - handled in template
        }

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

        function handlePageChange(page: number): void {
            budgetCRStore.pagination.page = page;
            budgetCRStore.fetchBudgetChangesRequestList();
        }

        function handlePageSizeChange(pageSize: number): void {
            budgetCRStore.pagination.pageSize = pageSize;
            budgetCRStore.pagination.page = 1;
            budgetCRStore.fetchBudgetChangesRequestList();
        }

        function handleSearch(value: string): void {
            budgetCRStore.filters.search = value;
            budgetCRStore.pagination.page = 1;
            budgetCRStore.fetchBudgetChangesRequestList();
        }

        function handleFilterChange(filters: Record<string, any>): void {
            budgetCRStore.filters.status = filters.status ?? '';
            budgetCRStore.filters.startDate = filters.startDate ?? '';
            budgetCRStore.filters.endDate = filters.endDate ?? '';
            budgetCRStore.pagination.page = 1;
            budgetCRStore.fetchBudgetChangesRequestList();
        }

        const router = useRouter();

        function handleActionClick(type: 'edit' | 'view', rowData: BudgetChangeRequest) {
            if (type === 'edit') {
                router.push(`/bcr/edit/${rowData.Id}`);
            } else if (type === 'view') {
                router.push(`/bcr/view/${rowData.Id}`);
            }
        }

        // handle sorting change
        const handleSortChange = ({ field, order }: { field: string; order: number }) => {
            // reset sorting
            if (order === 0 || !field) {
                budgetCRStore.setSorting('', '');
                return;
            }

            const mapFieldToApi: Record<string, string> = {
                DocNo: 'DocNo',
                RequestedBy: 'RequestedBy',
                RequestDate: 'RequestDate',
                Status: 'Status',
                TotalAmount: 'TotalAmount'
            };

            budgetCRStore.setSorting(mapFieldToApi[field] || 'RequestDate', order === 1 ? 'asc' : 'desc');
        };

        const currentSortField = computed(() => {
            const reverseMap: Record<string, string> = {
                DocNo: 'DocNo',
                RequestDate: 'RequestDate',
                Status: 'Status',
                TotalAmount: 'TotalAmount',
                RequestedBy: 'RequestedBy',
                CreatedAt: 'CreatedAt'
            };

            return reverseMap[budgetCRStore.sortField] || '';
        });

        const currentSortOrder = computed(() => {
            if (!budgetCRStore.sortField) return 0;
            return budgetCRStore.sortOrder === 'asc' ? 1 : -1;
        });

        return {
            budgetChangeRequestData,
            searchTerm,
            activeFilters,
            extraFilters,
            tableColumns,
            canCreateBCR,
            showCommentModal,
            selectedRequestNo,
            BudgetChangeRequestSummaryData,
            pagination: budgetCRStore.pagination,
            budgetCRStore,
            getStatusSeverity,
            handleSearch,
            handleFilterChange,
            handleActionClick,
            handlePageChange,
            handlePageSizeChange,
            bcrSummaryCol,
            handleSortChange,
            currentSortField,
            currentSortOrder,
            statusSeverity,
            proTableColumns,
            bcrSearchTerm,
            bcrStatusFilter,
            statusFilterOptions,
            pageSizeOptions,
            handleProTableSort,
            handleProTablePaginationUpdate,
            handleBcrSearch,
            handleBcrStatusFilterChange,
            formatDate
        };
    }
});
