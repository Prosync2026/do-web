<script setup lang="ts">
import { formatCurrency } from '@/utils/format.utils';
import { AlertTriangle, CheckCircle, DollarSign } from 'lucide-vue-next';

defineProps<{
    pendingCount: number;
    approvedCount: number;
    totalValue: number;
    totalApprovedValue: number;
}>();
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Pending Orders -->
        <div class="flex justify-between items-center p-6 bg-white dark:bg-gray-400/10 rounded-2xl shadow-sm border">
            <div>
                <h3 class="font-semibold text-gray-800 dark:text-white">Pending Orders</h3>
                <p class="text-2xl font-bold text-yellow-600 mt-2">{{ pendingCount }}</p>
                <p class="dark:text-white text-gray-500 text-sm">Awaiting approval</p>
            </div>
            <AlertTriangle class="w-6 h-6 text-yellow-600" />
        </div>

        <!-- Approved This Week -->
        <div class="flex justify-between items-center p-6 bg-white dark:bg-gray-400/10 rounded-2xl shadow-sm border">
            <div>
                <h3 class="font-semibold text-gray-800 dark:text-white">Approved This Week</h3>
                <p class="text-2xl font-bold text-green-600 mt-2">{{ approvedCount }}</p>
                <p class="dark:text-white text-gray-500 text-sm">Approved for purchase</p>
            </div>
            <CheckCircle class="w-6 h-6 text-green-600" />
        </div>

        <!-- Total Request Order Value -->
        <div class="flex justify-between items-center p-6 bg-white dark:bg-gray-400/10 rounded-2xl shadow-sm border">
            <div>
                <h3 class="font-semibold text-gray-800 dark:text-white">Total Approved Request Order</h3>
                <p class="text-2xl font-bold text-gray-800 dark:text-white mt-2">RM {{ formatCurrency(totalApprovedValue) }}</p>
                <p class="dark:text-white text-gray-500 text-sm">Total orders value</p>
            </div>
            <DollarSign class="dark:text-white w-6 h-6 text-gray-500" />
        </div>
    </div>
</template>
