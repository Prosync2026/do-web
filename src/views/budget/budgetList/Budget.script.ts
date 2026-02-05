import { useBudgetStore } from '@/stores/budget/budget.store';
import type { FilterVersion } from '@/types/budget.type';
import { defineComponent, onMounted, ref, watch } from 'vue';

import BaseTab from '@/components/tab/BaseTab.vue';
import Overview from '@/views/budget/budgetOverview/Overview.vue';
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

        onMounted(() => {
            fetchBudgetVersionList();
        });

        async function handleImportSuccess() {
            await fetchBudgetVersionList();
        }

        return {
            versions,
            viewOptions,
            selectedVersion,
            viewMode,
            detailViewMode,
            filters,
            handleImportSuccess,
            HierarchyItemCode,
            BudgetList,
            latestBudgetId
        };
    }
});
