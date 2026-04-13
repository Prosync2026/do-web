import { useBudgetStore } from '@/stores/budget/budget.store';
import type { TableColumn } from '@/types/table.type';
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';

import { formatCurrency } from '@/utils/format.utils';
import BudgetImportModal from '@/views/budget/components/dialog/BudgetImport.vue';
import EditBudgetItem from '@/views/budget/components/dialog/EditBudgetItem.vue';
import { ProButton, ProInput, ProMenu, ProSelect, ProTable, ProTag } from '@prosync_solutions/ui';

interface PaginationConfig {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default defineComponent({
    name: 'BudgetList',
    components: {
        BudgetImportModal,
        EditBudgetItem,
        ProButton,
        ProInput,
        ProMenu,
        ProSelect,
        ProTable,
        ProTag
    },
    props: {
        budgetId: {
            type: Number,
            required: true
        },
        // The versionCode of the currently selected budget passed from Budget.script.ts(parent)
        budgetVersionCode: {
            type: Number,
            default: null
        }
    },
    emits: ['success'],
    setup(props, { emit }) {
        const sortField = computed(() => budgetStore.sortField);
        const sortOrder = computed(() => budgetStore.sortOrder);

        async function handleSort(event: any) {
            budgetStore.setSorting(event.sortField, event.sortOrder);
            await fetchBudgetList(props.budgetId);
        }

        const budgetStore = useBudgetStore();
        const budgetItems = ref<any[]>([]);

        const comparisonData = computed(() => budgetStore.comparisonData);
        const comparisonItems = computed(() => comparisonData.value?.items || []);

        // Populated from comparisonData.availableVersions after first fetch
        const availableVersionOptions = computed(() => {
            const versions: { id: number; versionCode: number; docNo: string; budgetName: string; totalAmount: number }[] = comparisonData.value?.availableVersions || [];
            return versions.map((v) => ({
                label: `${v.budgetName}`,
                value: v.versionCode
            }));
        });

        // Default fromVersionCode = 1
        const selectedFromVersionCode = ref<number>(1);
        const selectedToVersionCode = ref<number | null>(null);

        // Labels derived from new API fields (fromVersion / toVersion)
        const previousVersionLabel = computed(() => {
            const v = comparisonData.value?.fromVersion;
            return v ? `${v.budgetName} (RM ${formatCurrency(v.totalAmount)})` : 'From Version';
        });
        const currentVersionLabel = computed(() => {
            const v = comparisonData.value?.toVersion;
            return v ? `${v.budgetName} (RM ${formatCurrency(v.totalAmount)})` : 'To Version';
        });

        // Impact Summary
        const impactSummary = computed(() => {
            const summary = comparisonData.value?.summary || {};
            const fromVersion = comparisonData.value?.fromVersion || {};
            const toVersion = comparisonData.value?.toVersion || {};

            const totalAmountDiff = (toVersion.totalAmount || 0) - (fromVersion.totalAmount || 0);

            return {
                totalItems: summary.totalItems || 0,
                newItems: summary.newItems || 0,
                removedItems: summary.removedItems || 0,
                changedItems: summary.changedItems || 0,
                unchangedItems: summary.unchangedItems || 0,
                totalAmountDiff
            };
        });

        const pagination = ref<PaginationConfig>({
            total: 0,
            totalPages: 1,
            page: 1,
            pageSize: 10
        });

        const search = ref('');
        const showImportModal = ref(false);
        const showEditModal = ref(false);
        const selectedEditItem = ref<any>(null);
        const filters = ref<Record<string, any>>({});

        const activeFilters = ref({
            location1: '' as string,
            location2: '' as string,
            element: '' as string,
            category: '' as string,
            changeType: 'all' as string
        });

        // Populated from API response filterOptions
        const filterOptions = computed(() => ({
            locations1: comparisonData.value?.filterOptions?.locations1 || [],
            locations2: comparisonData.value?.filterOptions?.locations2 || [],
            elements: comparisonData.value?.filterOptions?.elements || [],
            categories: comparisonData.value?.filterOptions?.categories || []
        }));

        const changeTypeOptions = [
            { label: 'All Changes', value: 'all' },
            { label: 'Added', value: 'new' },
            { label: 'Removed', value: 'removed' }
        ];

        const fetchComparison = async (page = pagination.value.page, pageSize = pagination.value.pageSize) => {
            await budgetStore.fetchBudgetComparison({
                search: search.value,
                page,
                pageSize,
                fromVersionCode: selectedFromVersionCode.value,
                toVersionCode: selectedToVersionCode.value ?? undefined,
                changeType: activeFilters.value.changeType,
                location1: activeFilters.value.location1 || undefined,
                location2: activeFilters.value.location2 || undefined,
                element: activeFilters.value.element || undefined,
                category: activeFilters.value.category || undefined
            });

            pagination.value.total = budgetStore.pagination.total;
            pagination.value.totalPages = budgetStore.pagination.totalPages;
            pagination.value.page = budgetStore.pagination.page;
            pagination.value.pageSize = budgetStore.pagination.pageSize;
        };

        async function handleFilterChange() {
            pagination.value.page = 1;
            if (comparisonData.value) {
                await fetchComparison(1);
            } else {
                await fetchBudgetList(props.budgetId, search.value || undefined);
            }
        }

        function handleFilterReset() {
            activeFilters.value = { location1: '', location2: '', element: '', category: '', changeType: 'all' };
            search.value = '';
            pagination.value.page = 1;
            if (comparisonData.value) {
                fetchComparison(1);
            } else {
                fetchBudgetList(props.budgetId);
            }
        }

        const fetchBudgetList = async (budgetId: number, searchTerm?: string) => {
            if (!budgetId) return;

            const params: any = {
                budgetId: budgetId,
                page: pagination.value.page,
                pageSize: pagination.value.pageSize
            };

            if (searchTerm) params.search = searchTerm;
            if (activeFilters.value.location1) params.location1 = activeFilters.value.location1;
            if (activeFilters.value.location2) params.location2 = activeFilters.value.location2;
            if (activeFilters.value.element) params.element = activeFilters.value.element;
            if (activeFilters.value.category) params.category = activeFilters.value.category;

            await budgetStore.fetchBudgetItems(params);

            budgetItems.value = budgetStore.budgetItems.map((item, index) => ({
                ...item,
                rowIndex: (pagination.value.page - 1) * pagination.value.pageSize + index + 1
            }));

            pagination.value.total = budgetStore.pagination.total;
            pagination.value.totalPages = budgetStore.pagination.totalPages;
        };

        watch(
            () => [props.budgetId, props.budgetVersionCode] as const,
            async ([newId, newVersionCode]) => {
                if (newId) {
                    // Sync toVersionCode to match the parent-selected version
                    if (newVersionCode && newVersionCode !== selectedToVersionCode.value) {
                        selectedToVersionCode.value = newVersionCode;
                    }
                    await fetchComparison(1);
                }
            },
            { immediate: true }
        );

        // Watch from/to version selectors
        watch(selectedFromVersionCode, async () => {
            pagination.value.page = 1;
            await fetchComparison(1);
        });

        watch(selectedToVersionCode, async (newVal) => {
            if (newVal === null) return;
            pagination.value.page = 1;
            await fetchComparison(1);
        });

        const filteredItems = computed(() => budgetItems.value);

        const isQS = computed(() => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) return false;
                const user = JSON.parse(userStr);
                return user?.role?.toLowerCase() === 'quantity surveyor';
            } catch {
                return false;
            }
        });

        async function handleImportSuccess() {
            showImportModal.value = false;
            emit('success');
            await fetchBudgetList(props.budgetId);
        }

        async function handleSearch(value: string) {
            search.value = value;
            filters.value.global = { value };
            pagination.value.page = 1;

            if (comparisonData.value) {
                await fetchComparison(1);
            } else {
                await fetchBudgetList(props.budgetId, value || undefined);
            }
        }

        // Debounce: auto-search after user stops typing
        let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
        watch(search, (newVal) => {
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                handleSearch(newVal);
            }, 500);
        });
        onUnmounted(() => {
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        });

        function handleImportClick() {
            showImportModal.value = true;
        }

        function handleEditClick(row: any) {
            selectedEditItem.value = row;
            showEditModal.value = true;
        }

        async function handleActionClick(type: string, row: any) {
            if (type === 'edit') {
                handleEditClick(row);
            }
        }

        async function handleEditSuccess() {
            showEditModal.value = false;
            if (comparisonData.value) {
                await fetchComparison(pagination.value.page, pagination.value.pageSize);
            } else {
                await fetchBudgetList(props.budgetId);
            }
        }

        async function handlePageChange(page: number) {
            pagination.value.page = page;
            if (comparisonData.value) {
                await fetchComparison(page, pagination.value.pageSize);
            } else {
                await fetchBudgetList(props.budgetId, search.value || undefined);
            }
        }

        async function handlePageSizeChange(size: number) {
            pagination.value.pageSize = size;
            pagination.value.page = 1;
            if (comparisonData.value) {
                await fetchComparison(1, size);
            } else {
                await fetchBudgetList(props.budgetId, search.value || undefined);
            }
        }

        onMounted(() => {
            if (comparisonData.value) {
                pagination.value.total = budgetStore.pagination.total;
                pagination.value.totalPages = budgetStore.pagination.totalPages;
            }
        });

        const comparisonTable = computed(() => {
            const currentPage = budgetStore.pagination.page;
            const currentPageSize = budgetStore.pagination.pageSize;
            return comparisonItems.value.map((item: any, index: number) => {
                const impact = item.isNew ? 'Added' : item.isRemoved ? 'Removed' : item.amountDiff > 0 ? 'Increase' : item.amountDiff < 0 ? 'Decrease' : 'No Change';
                return {
                    ...item,
                    impact,
                    rowIndex: (currentPage - 1) * currentPageSize + index + 1
                };
            });
        });

        const comparisonColumns = computed<TableColumn[]>(() => {
            const cols: TableColumn[] = [
                { field: 'rowIndex', header: '#' },
                { field: 'itemCode', header: 'Item Code', sortable: true },
                { field: 'description', header: 'Description', sortable: true },
                { field: 'category', header: 'Category', sortable: true },
                { field: 'element', header: 'Element', sortable: true },
                { field: 'subElement', header: 'Sub Element', sortable: true },
                { field: 'subSubElement', header: 'Sub Sub Element', sortable: true },
                { field: 'location1', header: 'Location 1', sortable: true },
                { field: 'location2', header: 'Location 2', sortable: true },
                { field: 'originalQty', header: 'Old Qty', sortable: true, class: '!bg-gray-100' },
                { field: 'originalAmount', header: 'Old Amount', sortable: true, bodySlot: 'amount', class: '!bg-gray-100' },
                { field: 'latestQty', header: 'New Qty', sortable: true, class: '!bg-blue-50' },
                { field: 'latestAmount', header: 'New Amount', sortable: true, bodySlot: 'amount', class: '!bg-blue-50' },
                { field: 'qtyDiff', header: 'Δ Qty', sortable: true },
                { field: 'amountDiff', header: 'Δ Amount', sortable: true, bodySlot: 'amount' },
                { field: 'impact', header: 'Impact', sortable: true, bodySlot: 'impact' }
            ];

            if (isQS.value) {
                cols.push({ field: 'actions', header: '', action: true, actions: ['edit'] });
            }
            return cols;
        });

        const columns = computed<TableColumn[]>(() => {
            const cols: TableColumn[] = [
                { field: 'rowIndex', header: '#' },
                { field: 'itemCode', header: 'Item Code', sortable: true },
                { field: 'description', header: 'Description', sortable: true },
                { field: 'location1', header: 'Location 1', sortable: true },
                { field: 'location2', header: 'Location 2', sortable: true },
                { field: 'category', header: 'Category', sortable: true },
                { field: 'elementCode', header: 'Element', sortable: true },
                { field: 'subElement', header: '1st Sub Element', sortable: true },
                { field: 'subSubElement', header: '2nd Sub Element', sortable: true },
                { field: 'unit', header: 'UOM', sortable: true },
                { field: 'qty', header: 'Qty', sortable: true },
                { field: 'totalOrderedQty', header: 'Ordered Qty', sortable: true },
                { field: 'totalRemainingQty', header: 'Remaining Qty', sortable: true, bodySlot: 'remainingQty' },
                { field: 'rate', header: 'Rate', sortable: true, bodySlot: 'rate' },
                { field: 'amount', header: 'Amount', sortable: true, bodySlot: 'amount' }
            ];

            if (isQS.value) {
                cols.push({ field: 'actions', header: '', action: true, actions: ['edit'] });
            }
            return cols;
        });

        function formatPercent(value?: number) {
            if (value == null) return '-';
            return `${value.toFixed(1)}%`;
        }

        function getUtilizationClass(value?: number) {
            if (value == null) return 'bg-gray-100 text-gray-600';
            if (value < 50) return 'bg-green-100 text-green-800';
            if (value < 80) return 'bg-yellow-100 text-yellow-800';
            if (value <= 100) return 'bg-orange-100 text-orange-800';
            return 'bg-red-100 text-red-800';
        }

        // sorting
        const handleSortChange = async ({ field, order }: { field: string; order: number }) => {
            if (!field || order === 0) {
                budgetStore.setSorting('', '');
                if (comparisonData.value) {
                    await fetchComparison(1);
                } else {
                    await fetchBudgetList(props.budgetId);
                }
                return;
            }

            const mapFieldToApi: Record<string, string> = {
                itemCode: 'ItemCode',
                description: 'Description',
                location1: 'Location1',
                location2: 'Location2',
                originalQty: 'V1Qty',
                latestQty: 'V2Qty',
                originalAmount: 'V1Amount',
                latestAmount: 'V2Amount',
                qtyDiff: 'QtyDiff',
                amountDiff: 'AmountDiff',
                impact: 'Impact',
                category: 'Category',
                elementCode: 'Element',
                subElement: 'SubElement',
                subSubElement: 'SubSubElement',
                unit: 'Unit',
                qty: 'Quantity',
                totalOrderedQty: 'totalOrderedQty',
                totalRemainingQty: 'totalRemainingQty',
                rate: 'Rate',
                amount: 'Amount',
                createdAt: 'CreatedAt'
            };

            const sortOrder = order === 1 ? 'asc' : 'desc';
            budgetStore.setSorting(mapFieldToApi[field] || 'CreatedAt', sortOrder);

            if (comparisonData.value) {
                await fetchComparison(1);
            } else {
                await fetchBudgetList(props.budgetId);
            }
        };

        const currentSortField = computed(() => {
            const reverseMap: Record<string, string> = {
                ItemCode: 'itemCode',
                Description: 'description',
                Location1: 'location1',
                Location2: 'location2',
                OriginalQty: 'originalQty',
                OriginalAmount: 'originalAmount',
                LatestQty: 'latestQty',
                LatestAmount: 'latestAmount',
                QtyDiff: 'qtyDiff',
                AmountDiff: 'amountDiff',
                Impact: 'impact',
                Category: 'category',
                Element: 'elementCode',
                SubElement: 'subElement',
                SubSubElement: 'subSubElement',
                Unit: 'unit',
                Quantity: 'qty',
                Rate: 'rate',
                Amount: 'amount',
                CreatedAt: 'createdAt'
            };

            return reverseMap[budgetStore.sorting.sortBy] || '';
        });

        const currentSortOrder = computed(() => {
            if (!budgetStore.sorting.sortBy) return 0;
            return budgetStore.sorting.sortOrder === 'asc' ? 1 : -1;
        });

        // ProTable columns for the budget items list (v-else table)
        const proTableBudgetColumns = computed(() => {
            const cols: any[] = [
                { key: 'itemCode', label: 'Item Code', sortable: true },
                { key: 'description', label: 'Description', sortable: true },
                { key: 'location1', label: 'Location 1', sortable: true },
                { key: 'location2', label: 'Location 2', sortable: true },
                { key: 'category', label: 'Category', sortable: true },
                { key: 'elementCode', label: 'Element', sortable: true },
                { key: 'subElement', label: '1st Sub Element', sortable: true },
                { key: 'subSubElement', label: '2nd Sub Element', sortable: true },
                { key: 'unit', label: 'UOM', sortable: true },
                { key: 'qty', label: 'Qty', sortable: true },
                { key: 'totalOrderedQty', label: 'Ordered Qty', sortable: true },
                { key: 'totalRemainingQty', label: 'Remaining Qty', sortable: true },
                { key: 'rate', label: 'Rate', sortable: true },
                { key: 'amount', label: 'Amount', sortable: true }
            ];
            if (isQS.value) {
                cols.push({ key: 'actions', label: '', actions: true });
            }
            return cols;
        });

        const proTableComparisonColumns = computed(() => {
            const cols: any[] = [
                { key: 'itemCode', label: 'Item Code', sortable: true },
                { key: 'description', label: 'Description', sortable: true },
                { key: 'category', label: 'Category', sortable: true },
                { key: 'element', label: 'Element', sortable: true },
                { key: 'subElement', label: 'Sub Element', sortable: true },
                { key: 'subSubElement', label: 'Sub Sub Element', sortable: true },
                { key: 'location1', label: 'Location 1', sortable: true },
                { key: 'location2', label: 'Location 2', sortable: true },
                { key: 'originalQty', label: 'Old Qty', sortable: true },
                { key: 'originalAmount', label: 'Old Amount', sortable: true },
                { key: 'latestQty', label: 'New Qty', sortable: true },
                { key: 'latestAmount', label: 'New Amount', sortable: true },
                { key: 'qtyDiff', label: 'Δ Qty', sortable: true },
                { key: 'amountDiff', label: 'Δ Amount', sortable: true },
                {
                    key: 'impact',
                    label: 'Impact',
                    sortable: true,
                    tagRules: [
                        { value: 'Added', variant: 'success' },
                        { value: 'Removed', variant: 'error' },
                        { value: 'Increase', variant: 'warn' },
                        { value: 'Decrease', variant: 'info' },
                        { value: 'No Change', variant: 'info' }
                    ]
                }
            ];
            if (isQS.value) {
                cols.push({ key: 'actions', label: '', actions: true });
            }
            return cols;
        });

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
            if (newPagination.page !== pagination.value.page) {
                handlePageChange(newPagination.page);
            }
        }

        return {
            columns,
            budgetItems,
            filteredItems,
            search,
            showImportModal,
            showEditModal,
            selectedEditItem,
            pagination,
            filters,
            showImportFile: isQS,
            formatCurrency,
            handleImportClick,
            handleEditClick,
            handleActionClick,
            handleEditSuccess,
            handlePageChange,
            handlePageSizeChange,
            handleImportSuccess,
            onSearchWrapper: handleSearch,
            formatPercent,
            getUtilizationClass,
            handleSort,
            sortField,
            sortOrder,
            handleSortChange,
            currentSortField,
            currentSortOrder,
            previousVersionLabel,
            currentVersionLabel,
            impactSummary,
            comparisonTable,
            comparisonColumns,
            comparisonData,
            // Version selector
            availableVersionOptions,
            selectedFromVersionCode,
            selectedToVersionCode,
            // Filters
            activeFilters,
            filterOptions,
            changeTypeOptions,
            handleFilterChange,
            handleFilterReset,
            // ProTable
            proTableComparisonColumns,
            proTableBudgetColumns,
            pageSizeOptions,
            handleProTableSort,
            handleProTablePaginationUpdate
        };
    }
});
