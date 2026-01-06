<script setup lang="ts">
import { setGlobalToast } from '@/utils/showNotification.utils';
import { useToast } from 'primevue/usetoast';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();

setGlobalToast(toast);

watch(
    () => route.query.unauthorized,
    (val) => {
        if (val) {
            toast.add({
                severity: 'error',
                summary: 'Access Denied',
                detail: 'You are not authorized to access that page.',
                life: 3000
            });

            // delay cleanup so toast can render
            setTimeout(() => {
                router.replace({ query: {} });
            }, 0);
        }
    },
    { immediate: true }
);
</script>

<template>
    <ConfirmDialog />
    <Toast />
    <router-view v-slot="{ Component }">
        <Motion :initial="{ opacity: 0, x: 40 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -40 }" :transition="{ duration: 0.4 }">
            <component :is="Component" />
        </Motion>
    </router-view>
</template>
