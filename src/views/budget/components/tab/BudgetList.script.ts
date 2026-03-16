import { useBudgetStore } from '@/stores/budget/budget.store';
import type { TableColumn } from '@/types/table.type';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';

import ReusableTable from '@/components/table/ReusableTable.vue';
import { formatCurrency } from '@/utils/format.utils';
import BudgetImportModal from '@/views/budget/components/dialog/BudgetImport.vue';

interface PaginationConfig {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default defineComponent({
    name: 'BudgetList',
    components: {
        ReusableTable,
        BudgetImportModal
    },
    props: {
        budgetId: {
            type: Number,
            required: true
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

        const previousVersionLabel = computed(() => comparisonData.value?.firstVersion?.budgetName || 'Previous Version');
        const currentVersionLabel = computed(() => {
            const code = budgetStore.selectedVersionCode || localStorage.getItem('selectedBudgetVersionCode');
            return code ? `Version ${code}` : (comparisonData.value?.latestVersion?.budgetName || 'Current Version');
        });

        // Impact Summary
        const impactSummary = computed(() => {
            const summary = comparisonData.value?.summary || {};
            const firstVersion = comparisonData.value?.firstVersion || {};
            const latestVersion = comparisonData.value?.latestVersion || {};

            const totalAmountDiff = (latestVersion.totalAmount || 0) - (firstVersion.totalAmount || 0);

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
        const filters = ref<Record<string, any>>({});

        const fetchBudgetList = async (budgetId: number, searchTerm?: string) => {
            if (!budgetId) return;

            const params: any = {
                budgetId: budgetId,
                page: pagination.value.page,
                pageSize: pagination.value.pageSize
            };

            // Pass search term to API for server-side searching
            if (searchTerm) params.search = searchTerm;

            await budgetStore.fetchBudgetItems(params);

            budgetItems.value = budgetStore.budgetItems.map((item, index) => ({
                ...item,
                rowIndex: (pagination.value.page - 1) * pagination.value.pageSize + index + 1
            }));

            pagination.value.total = budgetStore.pagination.total;
            pagination.value.totalPages = budgetStore.pagination.totalPages;
        };

        watch(
            () => props.budgetId,
            async (newId) => {
                if (newId) {
                    await budgetStore.fetchBudgetComparison({ search: search.value, page: 1, budgetId: newId });
                    
                    if (!comparisonData.value) {
                        await fetchBudgetList(newId);
                    }

                    pagination.value.total = budgetStore.pagination.total;
                    pagination.value.totalPages = budgetStore.pagination.totalPages;
                    pagination.value.page = budgetStore.pagination.page;
                    pagination.value.pageSize = budgetStore.pagination.pageSize;
                }
            },
            { immediate: true }
        );

        // No client-side filtering — search is handled server-side via fetchBudgetItems
        const filteredItems = computed(() => budgetItems.value);

        const showImportFile = computed(() => {
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

        function handleSearch(value: string) {
            search.value = value;
            filters.value.global = { value };
            pagination.value.page = 1;

            if (comparisonData.value) {
                budgetStore.fetchBudgetComparison({ search: value || '', page: 1, budgetId: props.budgetId });
            } else {
                // Pass the search term so the API does a server-side search
                fetchBudgetList(props.budgetId, value || undefined);
            }
        }

        function handleImportClick() {
            showImportModal.value = true;
        }

        async function handlePageChange(page: number) {
            pagination.value.page = page;
            if (comparisonData.value) {
                await budgetStore.fetchBudgetComparison({ search: search.value, page: page, pageSize: pagination.value.pageSize, budgetId: props.budgetId });
            } else {
                await fetchBudgetList(props.budgetId, search.value || undefined);
            }
            pagination.value.total = budgetStore.pagination.total;
            pagination.value.totalPages = budgetStore.pagination.totalPages;
            pagination.value.page = budgetStore.pagination.page;
            pagination.value.pageSize = budgetStore.pagination.pageSize;
        }

        async function handlePageSizeChange(size: number) {
            pagination.value.pageSize = size;
            pagination.value.page = 1;
            if (comparisonData.value) {
                await budgetStore.fetchBudgetComparison({ search: search.value, page: 1, pageSize: size, budgetId: props.budgetId });
            } else {
                await fetchBudgetList(props.budgetId, search.value || undefined);
            }
            pagination.value.total = budgetStore.pagination.total;
            pagination.value.totalPages = budgetStore.pagination.totalPages;
            pagination.value.page = budgetStore.pagination.page;
            pagination.value.pageSize = budgetStore.pagination.pageSize;
        }

        onMounted(() => {
            // Re-sync correct pagination specifically for the component state if comparison was loaded
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

        const comparisonColumns: TableColumn[] = [
            { field: 'rowIndex', header: '#' },
            { field: 'itemCode', header: 'Item Code', sortable: true },
            { field: 'description', header: 'Description', sortable: true },
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

        const columns: TableColumn[] = [
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
                    await budgetStore.fetchBudgetComparison({ search: search.value, page: 1, budgetId: props.budgetId });
                } else {
                    await fetchBudgetList(props.budgetId);
                }
                return;
            }

            // map table field → API field (VERY IMPORTANT)
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
                await budgetStore.fetchBudgetComparison({ search: search.value, page: 1, budgetId: props.budgetId });
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

        return {
            columns,
            budgetItems,
            filteredItems,
            search,
            showImportModal,
            pagination,
            filters,
            showImportFile,
            formatCurrency,
            handleImportClick,
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
            comparisonColumns
        };
    }
});
