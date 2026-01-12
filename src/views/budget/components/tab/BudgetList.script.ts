import { useBudgetStore } from '@/stores/budget/budget.store';
import type { TableColumn } from '@/types/table.type';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';

import ReusableTable from '@/components/table/ReusableTable.vue';
import { formatCurrency } from '@/utils/format.utils';

interface PaginationConfig {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default defineComponent({
    name: 'BudgetList',
    components: {
        ReusableTable
    },
    props: {
        budgetId: {
            type: Number,
            required: true
        }
    },
    setup(props) {
        const budgetStore = useBudgetStore();

        const columns: TableColumn[] = [
            { field: 'rowIndex', header: '#' },
            { field: 'itemCode', header: 'Item Code', sortable: true },
            { field: 'description', header: 'Description', sortable: true },
            { field: 'location1', header: 'Location 1', sortable: true },
            { field: 'location2', header: 'Location 2', sortable: true },
            { field: 'elementCode', header: 'Element', sortable: true },
            { field: 'subElement', header: '1st Sub Element', sortable: true },
            { field: 'subSubElement', header: '2nd Sub Element', sortable: true },
            { field: 'unit', header: 'UOM', sortable: true },
            { field: 'qty', header: 'Qty', sortable: true },
            { field: 'rate', header: 'Rate', sortable: true, bodySlot: 'rate' },
            { field: 'amount', header: 'Amount', sortable: true, bodySlot: 'amount' }
        ];

        const budgetItems = ref<any[]>([]);

        const pagination = ref<PaginationConfig>({
            total: 0,
            totalPages: 1,
            page: 1,
            pageSize: 10
        });

        const search = ref('');
        const showImportModal = ref(false);
        const filters = ref<Record<string, any>>({});

        const fetchBudgetList = async (budgetId: number) => {
            if (!budgetId) return;

            await budgetStore.fetchBudgetItems({
                budgetId: budgetId,
                page: pagination.value.page,
                pageSize: pagination.value.pageSize
            });

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
                    await fetchBudgetList(newId);
                }
            },
            { immediate: true }
        );

        const filteredItems = computed(() => {
            if (!search.value) return budgetItems.value;
            const keyword = search.value.toLowerCase();
            return budgetItems.value.filter((item) => Object.values(item).some((val) => String(val).toLowerCase().includes(keyword)));
        });

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

        function handleSearch(value: string) {
            search.value = value;
            filters.value.global = { value };
        }

        function handleImportClick() {
            showImportModal.value = true;
        }

        async function handlePageChange(page: number) {
            pagination.value.page = page;
            await fetchBudgetList(props.budgetId);
        }

        async function handlePageSizeChange(size: number) {
            pagination.value.pageSize = size;
            pagination.value.page = 1;
            await fetchBudgetList(props.budgetId);
        }

        onMounted(() => {
            fetchBudgetList(props.budgetId);
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
            onSearchWrapper: handleSearch
        };
    }
});
