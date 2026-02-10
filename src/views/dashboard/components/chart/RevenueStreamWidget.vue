<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const chartData = ref();
const chartOptions = ref();

// TO DO:replace with API later
const procurementData = ref([
    { month: 'Jan', requested: 60000, ordered: 45000, delivered: 30000 },
    { month: 'Feb', requested: 120000, ordered: 100000, delivered: 80000 },
    { month: 'Mar', requested: 90000, ordered: 70000, delivered: 65000 },
    { month: 'Apr', requested: 50000, ordered: 30000, delivered: 20000 }
]);

function setChartData() {
    const documentStyle = getComputedStyle(document.documentElement);

    return {
        labels: procurementData.value.map((d) => d.month),
        datasets: [
            {
                type: 'bar',
                label: 'Requested (RO)',
                backgroundColor: documentStyle.getPropertyValue('--p-blue-400'),
                data: procurementData.value.map((d) => d.requested),
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Ordered (PO)',
                backgroundColor: documentStyle.getPropertyValue('--p-pink-300'),
                data: procurementData.value.map((d) => d.ordered),
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Delivered (DO)',
                backgroundColor: documentStyle.getPropertyValue('--p-red-200'),
                data: procurementData.value.map((d) => d.delivered),
                barThickness: 32,
                borderRadius: {
                    topLeft: 8,
                    topRight: 8
                },
                borderSkipped: true
            }
        ]
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            }
        }
    };
}

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

onMounted(() => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});
</script>

<template>
    <div class="card shadow">
        <div class="font-semibold text-xl mb-4">Procurement Flow Overview</div>

        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
    </div>
</template>
