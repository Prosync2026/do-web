import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BudgetChangeItem, BudgetChangeRequest } from '@/types/budgetChangeRequest.type';
import { formatCurrency, formatNumber as formatNum, formatPercent as formatPct } from '@/utils/format.utils';
import ActivitiesLog from '@/views/budget/components/card/ActivitiesLog.vue';
import DiscussionThread from '@/views/budget/components/card/DiscussionThread.vue';
import { Motion } from '@motionone/vue';
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
    name: 'ViewBCR',
    components: { Motion, ActivitiesLog, DiscussionThread },
    setup() {
        const router = useRouter();
        const route = useRoute();
        const budgetCRStore = useBudgetChangeRequestStore();
        const projectName = ref<string>('');
        const singleBudgetChangeRequest = ref<BudgetChangeRequest | null>(null);
        onMounted(async () => {
            if (route.params.budgetChangeRequestId) {
                const data = await budgetCRStore.getSingleBudgetChange(Number(route.params.budgetChangeRequestId));
                singleBudgetChangeRequest.value = data;
            }

            const projectStr = localStorage.getItem('selectedProject');
            if (projectStr) {
                try {
                    const project = JSON.parse(projectStr);
                    projectName.value = project.name || '';
                } catch (e) {
                    console.error('Failed to parse selectedProject from localStorage', e);
                }
            }
        });

        const requestBy = computed(() => singleBudgetChangeRequest.value?.RequestedBy || '');
        const reason = computed(() => singleBudgetChangeRequest.value?.Reason || '');
        const remark = computed(() => singleBudgetChangeRequest.value?.Remark || '');
        const requestDate = computed(() => {
            const date = singleBudgetChangeRequest.value?.RequestDate;
            if (!date) return '';
            return typeof date === 'string' ? new Date(date).toLocaleDateString() : new Date(date).toLocaleDateString();
        });

        const items = computed<BudgetChangeItem[]>(() => {
            return singleBudgetChangeRequest.value?.budget_change_items || [];
        });

        const itemsWithCalc = computed(() => {
            return (items.value || []).map((item) => {
                const orderedQty = Number(item.OrderedQty || 0);
                const newOrder = Number(item.NewOrder || 0);
                const unitPrice = Number(item.UnitPrice || 0);

                const exceededQty = newOrder - orderedQty;
                const exceededPercent = orderedQty ? (exceededQty / orderedQty) * 100 : 0;
                const estimatedExceed = exceededQty * unitPrice;
                const varianceQty = exceededQty;
                const varianceAmount = estimatedExceed;

                return {
                    ...item,
                    ExceededQty: exceededQty,
                    ExceededPercent: exceededPercent,
                    EstimatedExceed: estimatedExceed,
                    VarianceQty: varianceQty,
                    VarianceAmount: varianceAmount
                };
            });
        });

        const totalVarianceAmount = computed(() => {
            return itemsWithCalc.value.reduce((sum, item) => sum + Number(item.VarianceAmount || 0), 0);
        });

        const activeTab = ref('detail');
        const tabItems = [
            { label: 'Detail', value: 'detail' },
            { label: 'Activities Log', value: 'activities' }
        ];

        const goBack = () => router.push({ name: 'bcr' });

        const formatPrice = (value: number | string) => {
            return formatCurrency(value);
        };

        const formatNumber = (value: number | string) => {
            return formatNum(value);
        };

        const formatPercent = (value: number | string) => {
            return formatPct(value);
        };

        return {
            requestBy,
            projectName,
            requestDate,
            reason,
            remark,
            itemsWithCalc,
            totalVarianceAmount,
            goBack,
            activeTab,
            tabItems,
            formatPrice,
            formatNumber,
            formatPercent,
            formatCurrency,
            singleBudgetChangeRequest
        };
    }
});
