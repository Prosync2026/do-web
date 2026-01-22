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
                { title: 'Under Review', value: reviewCount.toString(), description: 'Review in progress', icon: 'pi pi-exclamation-triangle', color: 'red' },
                { title: 'Pending Review', value: pendingReviewCount.toString(), description: 'Ready for review', icon: 'pi pi-comment', color: 'orange' },
                { title: 'Approved', value: approvedCount.toString(), description: 'Ready for implement', icon: 'pi pi-check-circle', color: 'green' }
            ];

            if (canViewPricing.value) {
                cards.push({
                    title: 'Total Value',
                    value: `$ ${formattedTotal}`,
                    description: 'Estimated budget impact',
                    icon: 'pi pi-chart-line',
                    color: 'blue'
                });
            }

            return cards;
        });

        const bcrSummaryCol = computed(() => (canViewPricing.value ? 4 : 3));

        const budgetCRStore = useBudgetChangeRequestStore();
        onMounted(async () => {
            await budgetCRStore.fetchBudgetChangesRequestList();
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

            columns.push({ field: 'actions', header: 'Actions', action: true });
            return columns;
        });

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
            currentSortOrder
        };
    }
});
