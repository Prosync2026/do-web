<script lang="ts">
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

import BaseTreeTable from '@/components/table/TreeTable.vue';

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
        BaseTreeTable,
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
        const initialLoad = ref(true);

        const pagination = ref<PaginationConfig>({
            total: 0,
            totalPages: 1,
            page: 1,
            pageSize: 10
        });

        const viewMode = ref<'overview' | 'detail'>('overview');
        const detailViewMode = ref<'list' | 'tree'>('list'); // 新增默认 list
        const search = ref('');
        const showImportModal = ref(false);
        const filters = ref<Record<string, any>>({});

        const treeNodes = ref<any[]>([]); // Tree Table nodes

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

            // Build Tree Table nodes grouped by itemCode > description
            const grouped: Record<string, any> = {};
            budgetItems.value.forEach((item) => {
                if (!grouped[item.itemCode]) grouped[item.itemCode] = {};
                if (!grouped[item.itemCode][item.description]) grouped[item.itemCode][item.description] = [];
                grouped[item.itemCode][item.description].push(item);
            });

            const nodes: any[] = [];
            let keyCounter = 0;
            for (const itemCode in grouped) {
                const itemNode: any = {
                    key: `item-${keyCounter++}`,
                    data: { label: itemCode },
                    leaf: false,
                    children: []
                };
                for (const desc in grouped[itemCode]) {
                    const descNode: any = {
                        key: `desc-${keyCounter++}`,
                        data: { label: desc },
                        leaf: false,
                        children: grouped[itemCode][desc].map((b: any) => ({
                            key: `child-${keyCounter++}`,
                            data: b,
                            leaf: true
                        }))
                    };
                    itemNode.children.push(descNode);
                }
                nodes.push(itemNode);
            }
            treeNodes.value = nodes;
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
            detailViewMode,
            search,
            showImportModal,
            pagination,
            filters,
            showImportFile,
            treeNodes,

            formatCurrency,
            handleImportSuccess,
            handleImportClick,
            handlePageChange,
            handlePageSizeChange,
            onSearchWrapper: handleSearch
        };
    }
});
</script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card mb-6">
            <BreadcrumbList />

            <!-- HEADER -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 class="text-2xl font-bold dark:text-white">Budget Management</h1>
                    <p class="text-gray-500 dark:text-white">Interactive charts showing budget distribution.</p>
                </div>

                <div class="flex items-center gap-2 w-full md:w-auto">
                    <Dropdown v-model="selectedVersion" :options="versions" optionLabel="label" optionValue="value" class="w-full md:w-64 h-10 rounded-lg" placeholder="Select Version">
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <span>{{ slotProps.option.label }}</span>
                                <Badge v-if="slotProps.option.latest" value="Latest" severity="primary" class="ml-2" />
                            </div>
                        </template>

                        <template #value="slotProps">
                            <div class="flex items-center" v-if="slotProps.value">
                                <span>{{ versions.find((v) => v.value === slotProps.value)?.label }}</span>
                                <Badge v-if="versions.find((v) => v.value === slotProps.value)?.latest" value="Latest" severity="primary" class="ml-2" />
                            </div>
                            <span v-else class="text-gray-400">Select Version</span>
                        </template>
                    </Dropdown>
                </div>
            </div>

            <!-- VIEW MODE SELECT -->
            <SelectButton v-model="viewMode" :options="viewOptions" optionLabel="label" optionValue="value" class="h-10 rounded-lg" />

            <!-- DETAIL SUB-VIEW BUTTONS -->
            <div v-if="viewMode === 'detail'" class="flex gap-2 mt-2 mb-4">
                <Button label="List View" icon="pi pi-list" :outlined="detailViewMode !== 'list'" @click="detailViewMode = 'list'" />
                <Button label="Tree View" icon="pi pi-sitemap" :outlined="detailViewMode !== 'tree'" @click="detailViewMode = 'tree'" />
            </div>

            <!-- OVERVIEW -->
            <div v-if="viewMode === 'overview'">
                <Overview class="col-span-12" />
            </div>

            <!-- DETAIL LIST VIEW -->
            <div v-else-if="detailViewMode === 'list'">
                <ReusableTable
                    :value="filteredItems"
                    :columns="columns"
                    emptyTitle="Budget List Data"
                    :pagination="pagination"
                    :onPageChange="handlePageChange"
                    :onPageSizeChange="handlePageSizeChange"
                    :filters="filters"
                    :search="search"
                    @search="onSearchWrapper"
                    :showImportFile="showImportFile"
                    :onImportFile="handleImportClick"
                >
                    <template #rate="{ data }"> RM {{ formatCurrency(data.rate) }} </template>
                    <template #amount="{ data }"> RM {{ formatCurrency(data.amount) }} </template>
                </ReusableTable>
            </div>

            <!-- DETAIL TREE VIEW -->
            <div v-else-if="detailViewMode === 'tree'">
                <BaseTreeTable :nodes="treeNodes" :pagination="pagination">
                  
                    <Column field="label" header="Item / Description" :expander="true" />

                    <Column field="rowIndex" header="#" />
                    <Column field="location1" header="Location 1" />
                    <Column field="location2" header="Location 2" />
                    <Column field="elementCode" header="Element" />
                    <Column field="subElement" header="1st Sub Element" />
                    <Column field="subSubElement" header="2nd Sub Element" />
                    <Column field="unit" header="UOM" />
                    <Column header="Qty">
                        <template #body="{ node }">{{ node.data?.qty }}</template>
                    </Column>
                    <Column header="Rate">
                        <template #body="{ node }">RM {{ formatCurrency(node.data?.rate) }}</template>
                    </Column>
                    <Column header="Amount">
                        <template #body="{ node }">RM {{ formatCurrency(node.data?.amount) }}</template>
                    </Column>
                </BaseTreeTable>
            </div>

            <BudgetImportModal :visible="showImportModal" @close="showImportModal = false" @success="handleImportSuccess" />
            <ConfirmPopup />
        </div>
    </Motion>
</template>
