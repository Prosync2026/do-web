<script lang="ts">
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import { formatDate } from '@/utils/dateHelper';
import { ProAvatar, ProCard, ProEmpty, ProPagination, ProSpinner, ProTag } from '@prosync_solutions/ui';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    name: 'ActivitiesLog',
    components: { ProCard, ProAvatar, ProTag, ProSpinner, ProEmpty, ProPagination },
    setup() {
        const route = useRoute();
        const bcrStore = useBudgetChangeRequestStore();
        const loading = ref(false);

        const loadActivities = async () => {
            const id = Number(route.params.budgetChangeRequestId);
            if (!id) return;

            loading.value = true;
            try {
                await bcrStore.getBudgetChangeRequestActivity(id);
            } finally {
                loading.value = false;
            }
        };

        onMounted(loadActivities);
        watch(
            () => route.params.budgetChangeRequestId,
            () => {
                currentPage.value = 1;
                loadActivities();
            }
        );

        const activities = computed(() => bcrStore.historyList);
        const currentPage = ref(1);
        const pageSize = 5;
        const totalPages = computed(() => Math.ceil((activities.value?.length || 0) / pageSize));
        const paginatedActivities = computed(() => {
            const start = (currentPage.value - 1) * pageSize;
            return (activities.value || []).slice(start, start + pageSize);
        });

        return {
            loading,
            formatDate,
            activities,
            paginatedActivities,
            currentPage,
            totalPages,
            requestNo: route.params.requestNo
        };
    }
});
</script>

<template>
    <ProCard title="Activities Log" shadow class="mb-6">
        <ProSpinner v-if="loading" text="Loading activities..." />
        <ProEmpty v-else-if="!activities || activities.length === 0" title="No Activities" description="No activity logs found." />
        <template v-else>
            <ul class="space-y-4 text-sm">
                <li v-for="(log, index) in paginatedActivities" :key="index" class="flex gap-3">
                    <ProAvatar :name="log.UserName || 'Unknown User'" size="sm" />
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="font-semibold">{{ log.UserName || 'Unknown User' }}</span>
                            <ProTag :label="log.UserRole" variant="primary" />
                            <span class="text-gray-400 text-xs">{{ formatDate(log.CreatedAt) }}</span>
                        </div>
                        <div class="mt-1 text-gray-700 text-sm">
                            {{ log.ActionDetails }}
                        </div>
                    </div>
                </li>
            </ul>
            <div v-if="totalPages > 1" class="mt-4 flex justify-center">
                <ProPagination v-model="currentPage" :totalPages="totalPages" :maxVisible="5" />
            </div>
        </template>
    </ProCard>
</template>
