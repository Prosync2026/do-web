<script setup lang="ts">
import { useDashboard } from '@/composables/useDashboard';
import { Motion } from '@motionone/vue';
import { onMounted } from 'vue';

import GeneralDashboard from './GeneralDashboard.vue';
import PurchasingDashboard from './purchasing/PurchasingDashboard.vue';

const { isPurchasingRole, loadUserRole } = useDashboard();

onMounted(() => {
    loadUserRole();
});
</script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }" class="w-full overflow-x-hidden pb-4">
        <PurchasingDashboard v-if="isPurchasingRole" />
        <GeneralDashboard v-else />
    </Motion>
</template>
