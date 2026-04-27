<script setup lang="ts">
import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';
import { PhShoppingCart } from '@phosphor-icons/vue';

const roStore = useRequestOrderStore();
</script>

<template>
    <div class="relative inline-flex items-center justify-center">
        <PhShoppingCart :size="20" />
        <div v-if="roStore.pendingCount > 0" class="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-bold px-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-sm pointer-events-none transform scale-90 origin-top-right">
            {{ roStore.pendingCount > 99 ? '99+' : roStore.pendingCount }}
        </div>
    </div>
</template>
