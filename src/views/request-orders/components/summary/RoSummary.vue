<script setup lang="ts">
import { formatCurrency } from '@/utils/format.utils';
import { AlertTriangle, CheckCircle, DollarSign } from 'lucide-vue-next';
import { ProCard } from '@prosync_solutions/ui';

defineProps<{
    submittedCount: number;
    approvedCount: number;
    totalValue: number;
    totalApprovedValue: number;
}>();
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Pending Orders -->
        <ProCard class="shadow-sm border-0 border-l-4 border-yellow-500">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold text-text-heading">Pending Orders</h3>
                    <p class="text-3xl font-bold text-yellow-600 mt-2">{{ submittedCount }}</p>
                    <p class="text-text-subtitle text-sm mt-1">Awaiting approval</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                    <AlertTriangle class="w-6 h-6 text-yellow-600" />
                </div>
            </div>
        </ProCard>

        <!-- Approved Orders -->
        <ProCard class="shadow-sm border-0 border-l-4 border-green-500">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold text-text-heading">Approved Orders</h3>
                    <p class="text-3xl font-bold text-green-600 mt-2">{{ approvedCount }}</p>
                    <p class="text-text-subtitle text-sm mt-1">Approved for purchase</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle class="w-6 h-6 text-green-600" />
                </div>
            </div>
        </ProCard>

        <!-- Total Request Order Value -->
        <ProCard class="shadow-sm border-0 border-l-4 border-brand-primary">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold text-text-heading">Total Approved Value</h3>
                    <p class="text-3xl font-bold text-brand-primary mt-2">RM {{ formatCurrency(totalApprovedValue) }}</p>
                    <p class="text-text-subtitle text-sm mt-1">Overall accepted value</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <DollarSign class="w-6 h-6 text-brand-primary" />
                </div>
            </div>
        </ProCard>
    </div>
</template>
