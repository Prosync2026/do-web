<script setup lang="ts">
import { formatCurrency } from '@/utils/format.utils';
import { AlertTriangle, CheckCircle, DollarSign } from 'lucide-vue-next';
import { ProStatisticCard } from '@prosync_solutions/ui';

defineProps<{
    submittedCount: number;
    approvedCount: number;
    totalValue: number;
    totalApprovedValue: number;
}>();
</script>

<template>
    <div class="grid grid-cols-12 gap-4 mb-6">
        <!-- Pending Orders -->
        <ProStatisticCard
            class="col-span-12 md:col-span-4"
            label="Pending Orders"
            :value="submittedCount"
            subtitle="Awaiting approval"
            :icon="AlertTriangle"
            iconBg="bg-surface-warn"
        />

        <!-- Approved Orders -->
        <ProStatisticCard
            class="col-span-12 md:col-span-4"
            label="Approved Orders"
            :value="approvedCount"
            subtitle="Approved for purchase"
            :icon="CheckCircle"
            iconBg="bg-surface-success"
        />

        <!-- Total Request Order Value -->
        <ProStatisticCard
            class="col-span-12 md:col-span-4"
            label="Total Approved Value"
            :value="`RM ${formatCurrency(totalApprovedValue)}`"
            subtitle="Overall accepted value"
            :icon="DollarSign"
            iconBg="bg-surface-primary"
        />
    </div>
</template>
