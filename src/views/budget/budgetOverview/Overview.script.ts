import BudgetSummaryData from '@/components/summaryCard/SummaryCard.vue';
import { budgetService } from '@/services/budget.service';
import type { CardItem } from '@/types/card.type';
import { Chart } from 'highcharts-vue';
import { computed, defineComponent, onMounted, reactive, ref } from 'vue';

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
        highcharts: Chart
    },
    setup() {
        /* =======================
           STATE
        ======================= */

        const BudgetSummaryDataList = ref<CardItem[]>([]);
        const isLoadingSummary = ref(false);

        const pieData = ref<any>(null);
        const pieOptions = ref<any>(null);

        /* =======================
           CHART MOCK DATA
        ======================= */

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

        /* =======================
           COMPUTED
        ======================= */

        const breadcrumbTitle = computed(() => (path.value.length ? `Budget by (${path.value.at(-1)})` : 'Budget by Cost Centre (Material)'));

        /* =======================
           METHODS
        ======================= */

        function mapStatisticsToCards(data: BudgetStatisticsResponse): CardItem[] {
            return [
                {
                    title: 'Total Budget',
                    value: `$${data.totalBudget.toLocaleString()}`,
                    description: 'Total approved budget',
                    icon: 'pi pi-dollar',
                    color: 'orange'
                },
                {
                    title: 'Total Requested',
                    value: `$${data.totalRequested.toLocaleString()}`,
                    description: `Total requested budget`,
                    icon: 'pi pi-database',
                    color: 'green'
                },
                {
                    title: 'Total Balance',
                    value: `$${data.totalBalance.toLocaleString()}`,
                    description: `Remaining budget balance`,
                    icon: 'pi pi-building',
                    color: 'blue'
                }
            ];
        }

        function setColorOptions() {
            pieData.value = {};
            pieOptions.value = {};
        }

        /* =======================
           LIFECYCLE
        ======================= */

        onMounted(async () => {
            console.log('🚀 Overview mounted');

            setColorOptions();
            isLoadingSummary.value = true;

            try {
                const budgetId = 1;
                const statistics = await budgetService.budgetStatistics(budgetId);

                const getStatisticsData = statistics.data;

                const cards = mapStatisticsToCards(getStatisticsData);

                console.log('🧩 Mapped cards:', cards);

                BudgetSummaryDataList.value = cards;

                console.log('✅ Final BudgetSummaryDataList:', BudgetSummaryDataList.value);
            } catch (error) {
                console.error('❌ Failed to load summary', error);
            } finally {
                isLoadingSummary.value = false;
            }
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
