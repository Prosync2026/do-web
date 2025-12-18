import { useBudgetStore } from '@/stores/budget/budget.store';
import type { FilterVersion } from '@/types/budget.type';
import type { TableColumn } from '@/types/table.type';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';

import BaseTab from '@/components/tab/BaseTab.vue';
import ReusableTable from '@/components/table/ReusableTable.vue';
import { formatCurrency } from '@/utils/format.utils';
import Overview from '@/views/budget/budgetOverview/Overview.vue';
import BudgetImportModal from '@/views/budget/components/dialog/BudgetImport.vue';

import { setGlobalToast, showInfo } from '@/utils/showNotification.utils';
import { Motion } from '@motionone/vue';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import ConfirmPopup from 'primevue/confirmpopup';
import Dropdown from 'primevue/dropdown';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

interface PaginationConfig {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default defineComponent({
    name: 'BudgetManagement',
    components: {
        BaseTab,
        Motion,
        Badge,
        Button,
        Dropdown,
        SelectButton,
        Tag,
        ReusableTable,
        Overview,
        BudgetImportModal,
        ConfirmPopup
    },
    setup() {
        const budgetStore = useBudgetStore();
        const toast = useToast();
        setGlobalToast(toast);

        const viewOptions = [
            { label: 'Overview', value: 'overview' },
            { label: 'Detail', value: 'detail' }
        ];

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

        /* ---------------------- STATES ---------------------- */
        const versions = ref<FilterVersion[]>([]);
        const selectedVersion = ref<string>('');
        const latestBudgetId = ref<number | null>(null);
        const budgetItems = ref<any[]>([]);
        const previousVersion = ref<string | null>(null);
        const initialLoad = ref(true); // 初始加载标识

        const pagination = ref<PaginationConfig>({
            total: 0,
            totalPages: 1,
            page: 1,
            pageSize: 10
        });

        const viewMode = ref<'overview' | 'detail'>('overview');
        const search = ref('');
        const showImportModal = ref(false);
        const filters = ref<Record<string, any>>({});

        /* ---------------------- API ---------------------- */
        const fetchBudgetVersionList = async () => {
            const versionsData = await budgetStore.fetchBudgetVersion();
            if (!versionsData || versionsData.length === 0) return;

            const sorted = [...versionsData].sort((a, b) => Number(a.versionCode) - Number(b.versionCode));
            const latestVersionCode = Math.max(...sorted.map((v) => Number(v.versionCode)));

            versions.value = sorted.map((item) => ({
                label: `Version ${item.versionCode}`,
                value: String(item.versionCode),
                latest: Number(item.versionCode) === latestVersionCode,
                id: item.id
            }));

            const latest = versions.value.find((v) => v.latest);
            if (latest) {
                selectedVersion.value = latest.value;
                latestBudgetId.value = latest.id!;
            }
        };

        const fetchBudgetList = async () => {
            if (!latestBudgetId.value) return;

            await budgetStore.fetchBudgetItems(latestBudgetId.value, pagination.value.page, pagination.value.pageSize);

            budgetItems.value = budgetStore.budgetItems.map((item, index) => ({
                ...item,
                rowIndex: (pagination.value.page - 1) * pagination.value.pageSize + index + 1
            }));

            pagination.value.total = budgetStore.pagination.total;
            pagination.value.totalPages = budgetStore.pagination.totalPages;
        };

        /* ---------------------- COMPUTED ---------------------- */
        const filteredItems = computed(() => {
            if (!search.value) return budgetItems.value;
            const keyword = search.value.toLowerCase();

            return budgetItems.value.filter((item) => Object.values(item).some((val) => String(val).toLowerCase().includes(keyword)));
        });

        /* ---------------------- WATCHERS ---------------------- */
        watch(selectedVersion, async (newVersion) => {
            if (!newVersion) return;

            const selected = versions.value.find((v) => v.value === newVersion);
            if (!selected) return;

            if (!initialLoad.value && previousVersion.value && previousVersion.value !== newVersion) {
                showInfo(`Switched to Version ${newVersion}`);
                localStorage.setItem('latestBudgetVersion', newVersion.toString());
            }

            previousVersion.value = newVersion;
            latestBudgetId.value = selected.id!;

            await fetchBudgetList();

            if (initialLoad.value) initialLoad.value = false;
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
            await fetchBudgetList();
        }

        async function handlePageSizeChange(size: number) {
            pagination.value.pageSize = size;
            pagination.value.page = 1;
            await fetchBudgetList();
        }

        async function handleImportSuccess() {
            showImportModal.value = false;
            await fetchBudgetVersionList();
            await fetchBudgetList();
        }

        onMounted(() => {
            fetchBudgetVersionList();
        });

        const showImportFile = computed(() => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) return false;

                const user = JSON.parse(userStr);

                const role = user?.role;
                if (!role) return false;

                return role.toLowerCase() === 'quantity surveyor';
            } catch (e) {
                return false;
            }
        });

        return {
            versions,
            columns,
            viewOptions,
            budgetItems,
            filteredItems,
            selectedVersion,
            viewMode,
            search,
            showImportModal,
            pagination,
            filters,
            showImportFile,

            formatCurrency,
            handleImportSuccess,
            handleImportClick,
            handlePageChange,
            handlePageSizeChange,
            onSearchWrapper: handleSearch
        };
    }
});
