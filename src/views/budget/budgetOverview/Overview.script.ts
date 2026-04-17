import BudgetSummaryData from '@/components/summaryCard/SummaryCard.vue';
import { budgetService } from '@/services/budget.service';
import type { CardItem } from '@/types/card.type';
import { showError, showWarning } from '@/utils/showNotification.utils';
import { ProCard, ProSpinner } from '@prosync_solutions/ui';
import { PhCurrencyDollar, PhDatabase, PhBuildings } from '@phosphor-icons/vue';
import { Chart } from 'highcharts-vue';
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue';

interface BudgetStatisticsResponse {
    totalBudget: number;
    totalRequested: number;
    totalBalance: number;
}

type ChartData = {
    categories: string[];
    series: number[];
    drillMap?: Record<string, ChartData>;
};

export default defineComponent({
    name: 'Overview',
    components: {
        BudgetSummaryData,
        highcharts: Chart,
        ProCard,
        ProSpinner
    },
    props: {
        budgetId: {
            type: Number,
            required: true
        },
        version: {
            type: String,
            required: true
        }
    },

    setup(props) {
        const BudgetSummaryDataList = ref<CardItem[]>([]);
        const isLoadingSummary = ref(true);
        const budgetId = ref<number | null>(null);

        const pieData = ref<any>(null);
        const pieOptions = ref<any>(null);

        const dataMap: Record<string, ChartData> = {
            root: {
                categories: ['Concrete', 'Steel', 'Bricks'],
                series: [60, 20, 10]
            }
        };

        const history = ref<ChartData[]>([dataMap.root]);
        const level = ref(0);
        const path = ref<string[]>([]);

        const chartOptions = reactive({
            chart: { type: 'column' },
            title: { text: '' },
            xAxis: { categories: dataMap.root.categories },
            yAxis: { title: { text: '' } },
            legend: { enabled: false },
            series: [{ data: dataMap.root.series }]
        });

        const breadcrumbTitle = computed(() => (path.value.length ? `Budget by (${path.value.at(-1)})` : 'Budget by Cost Centre (Material)'));

        function mapStatisticsToCards(data: Partial<BudgetStatisticsResponse>): CardItem[] {
            const totalBudget = data.totalBudget ?? 0;
            const totalRequested = data.totalRequested ?? 0;
            const totalBalance = data.totalBalance ?? 0;

            return [
                {
                    title: 'Total Budget',
                    value: `RM ${totalBudget.toLocaleString()}`,
                    description: 'Total approved budget',
                    icon: PhCurrencyDollar,
                    color: 'bg-surface-info'
                },
                {
                    title: 'Total Requested',
                    value: `RM ${totalRequested.toLocaleString()}`,
                    description: 'Total requested budget',
                    icon: PhDatabase,
                    color: 'bg-surface-success'
                },
                {
                    title: 'Total Balance',
                    value: `RM ${totalBalance.toLocaleString()}`,
                    description: 'Remaining budget balance',
                    icon: PhBuildings,
                    color: 'bg-surface-warn'
                }
            ];
        }

        async function loadStatistics(id: number) {
            isLoadingSummary.value = true;

            try {
                const statistics = await budgetService.budgetStatistics(id);

                if (!statistics.success) {
                    showError('Budget not found.');
                    showWarning('Please upload budget to proceed.');
                    return;
                }

                const cards = mapStatisticsToCards(statistics.data);

                BudgetSummaryDataList.value = cards;
            } catch (error) {
                console.error('❌ Failed to load summary', error);
            } finally {
                isLoadingSummary.value = false;
            }
        }

        watch(
            () => props.budgetId,
            (id) => {
                if (id) loadStatistics(id);
            },
            { immediate: true }
        );

        function setColorOptions() {
            pieData.value = {};
            pieOptions.value = {};
        }

        onMounted(() => {
            setColorOptions();

            budgetId.value = 1;
        });

        return {
            BudgetSummaryDataList,
            isLoadingSummary,
            pieData,
            pieOptions,
            chartOptions,
            breadcrumbTitle,
            level,
            path
        };
    }
});
