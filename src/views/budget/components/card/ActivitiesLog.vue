<script lang="ts">
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import { formatDate } from '@/utils/dateHelper';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
    name: 'ActivitiesLog',
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
        watch(() => route.params.requestNo, loadActivities);

        return {
            loading,
            formatDate,
            activities: computed(() => bcrStore.historyList),
            requestNo: route.params.requestNo
        };
    }
});
</script>

<template>
    <div class="card p-4 mb-6 shadow">
        <h3 class="text-lg font-semibold mb-4">Activities Log</h3>

        <ul v-if="!loading" class="space-y-4 text-sm">
            <li v-for="(log, index) in activities" :key="index" class="flex gap-3">
                <!-- Icon Circle -->
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <i :class="log.ActionType === 'UPDATED' ? 'pi pi-user-edit' : 'pi pi-info-circle'" class="text-primary text-sm"></i>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold">{{ log.UserName || 'Unknown User' }}</span>
                        <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
                            {{ log.UserRole }}
                        </span>
                        <span class="text-gray-400 text-xs">{{ formatDate(log.CreatedAt) }}</span>
                    </div>

                    <div class="mt-1 text-gray-700 text-sm">
                        {{ log.ActionDetails }}
                    </div>
                </div>
            </li>
        </ul>

        <div v-else class="text-center text-gray-500 py-4">Loading activities...</div>
    </div>
</template>
