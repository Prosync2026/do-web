<script setup lang="ts">
import { useAppInitializer } from '@/bootstrap/useAppInitializer';
import { setGlobalToast } from '@/utils/showNotification.utils';
import { useToast } from 'primevue/usetoast';
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();

setGlobalToast(toast);

const { init } = useAppInitializer();

onMounted(async () => {
    await init();
});

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
    <router-view />
</template>
