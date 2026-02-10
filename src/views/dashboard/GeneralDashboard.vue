<script setup lang="ts">
import SummaryCard from '@/components/summaryCard/SummaryCard.vue';
import { budgetService } from '@/services/budget.service';
import type { CardItem } from '@/types/card.type';
import { onMounted, ref } from 'vue';
import RevenueStreamWidget from './components/chart/RevenueStreamWidget.vue';

// ---------------------------
// STATE
// ---------------------------
const BudgetSummaryData = ref<CardItem[]>([]);
const isLoading = ref(false);

// ---------------------------
// HELPERS
// ---------------------------
function mapStatisticsToCards(data: any): CardItem[] {
    const totalBudget = data.totalBudget ?? 0;
    const totalRequested = data.totalRequested ?? 0;
    const totalOrdered = data.totalOrdered ?? 0;
    const totalDelivered = data.totalDelivered ?? 0;
    const totalBalance = data.totalBalance ?? 0;

    return [
        {
            title: 'Total Budget',
            value: `RM ${totalBudget.toLocaleString()}`,
            description: 'Approved budget',
            icon: 'pi pi-dollar',
            color: 'orange'
        },
        {
            title: 'Requested',
            value: `RM ${totalRequested.toLocaleString()}`,
            description: 'Total requested amount',
            icon: 'pi pi-file',
            color: 'blue'
        },
        {
            title: 'Delivered',
            value: `RM ${totalDelivered.toLocaleString()}`,
            description: 'Delivered value',
            icon: 'pi pi-truck',
            color: 'green'
        },
        {
            title: 'Balance',
            value: `RM ${totalBalance.toLocaleString()}`,
            description: totalBalance < 0 ? 'Over Budget!' : 'Remaining balance',
            icon: 'pi pi-wallet',
            color: totalBalance < 0 ? 'red' : 'purple'
        }
    ];
}

// ---------------------------
// LOAD DATA
// ---------------------------
async function loadDashboard() {
    try {
        isLoading.value = true;

        const rawBudgetId = localStorage.getItem('selectedBudgetVersionId');
        const budgetId = rawBudgetId ? Number(rawBudgetId) : null;

        console.log('📊 Dashboard BudgetId:', budgetId);

        if (!budgetId) return;

        const stats = await budgetService.budgetStatistics(budgetId);

        console.log('📊 Dashboard Stats:', stats);

        BudgetSummaryData.value = mapStatisticsToCards(stats.data);
    } catch (err) {
        console.error('Dashboard load failed', err);
    } finally {
        isLoading.value = false;
    }
}

window.addEventListener('storage', (e) => {
    if (e.key === 'selectedBudgetVersionId') {
        loadDashboard();
    }
});

// ---------------------------
// LIFECYCLE
// ---------------------------
onMounted(() => {
    loadDashboard();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <SummaryCard :cardItems="BudgetSummaryData" :cardCol="4" />

        <div class="col-span-12 xl:col-span-12">
            <RevenueStreamWidget />
        </div>
    </div>
</template>
