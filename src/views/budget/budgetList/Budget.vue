<script lang="ts">
import { useBudgetStore } from '@/stores/budget/budget.store';
import type { FilterVersion } from '@/types/budget.type';
import { defineComponent, onMounted, ref, watch } from 'vue';

import BaseTab from '@/components/tab/BaseTab.vue';
import Overview from '@/views/budget/budgetOverview/Overview.vue';
import BudgetImportModal from '@/views/budget/components/dialog/BudgetImport.vue';
import BudgetList from '../components/tab/BudgetList.vue';
import HierarchyItemCode from '../components/tab/HierarchyItemCode.vue';
import HierarchyLocation from '../components/tab/HierarchyLocation.vue';

import { setGlobalToast, showInfo } from '@/utils/showNotification.utils';
import { Motion } from '@motionone/vue';

import { useToast } from 'primevue/usetoast';

export default defineComponent({
    name: 'BudgetManagement',
    components: {
        BaseTab,
        Motion,
        Overview,
        BudgetImportModal,
        HierarchyItemCode,
        HierarchyLocation,
        BudgetList
    },
    setup() {
        const budgetStore = useBudgetStore();
        const toast = useToast();
        setGlobalToast(toast);

        const viewOptions = [
            { label: 'Overview', value: 'overview' },
            { label: 'Detail', value: 'detail' }
        ];

        const versions = ref<FilterVersion[]>([]);
        const selectedVersion = ref<string>('');
        const latestBudgetId = ref<number | null>(null);
        const previousVersion = ref<string | null>(null);
        const initialLoad = ref(true);

        const viewMode = ref<'overview' | 'detail'>('overview');
        const detailViewMode = ref<'list' | 'tree' | 'treeLocation'>('list');

        const showImportModal = ref(false);
        const filters = ref<Record<string, any>>({});

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

            if (initialLoad.value) initialLoad.value = false;
        });

        async function handleImportSuccess() {
            showImportModal.value = false;
            await fetchBudgetVersionList();
        }

        onMounted(() => {
            fetchBudgetVersionList();
        });

        return {
            versions,
            viewOptions,
            selectedVersion,
            viewMode,
            detailViewMode,
            showImportModal,
            filters,
            HierarchyItemCode,
            BudgetList,
            handleImportSuccess,
            latestBudgetId
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
                <Button label="Tree Table Item Code View" icon="pi pi-sitemap" :outlined="detailViewMode !== 'tree'" @click="detailViewMode = 'tree'" />
                <Button label="Tree Table Location View" icon="pi pi-map" :outlined="detailViewMode !== 'treeLocation'" @click="detailViewMode = 'treeLocation'" />
            </div>

            <div v-if="viewMode === 'overview'">
                <Overview class="col-span-12" />
            </div>

            <div v-else-if="detailViewMode === 'list'">
                <BudgetList :budgetId="Number(latestBudgetId)" />
            </div>

            <div v-else-if="detailViewMode === 'tree'">
                <HierarchyItemCode :budgetId="Number(latestBudgetId)" />
            </div>

            <div v-else-if="detailViewMode === 'treeLocation'">
                <HierarchyLocation :budgetId="Number(latestBudgetId)" />
            </div>

            <BudgetImportModal :visible="showImportModal" @close="showImportModal = false" @success="handleImportSuccess" />
            <ConfirmPopup />
        </div>
    </Motion>
</template>
