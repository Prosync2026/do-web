<script setup lang="ts">
import { useAuthStore } from '@/stores/auth/auth.store';
import { ProLoginPage } from '@prosync_solutions/ui';
import { useToast } from '@/utils/toastBus';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const isLoading = ref(false);
const errorMessage = ref('');

const handleLogin = async ({ username, password }: any) => {
    errorMessage.value = '';
    isLoading.value = true;
    try {
        const success = await authStore.login(username, password, true);
        if (success) {
            toast.add({
                severity: 'success',
                summary: 'Login Successful',
                detail: `Welcome ${authStore.userName}!`,
                life: 3000
            });
            router.push({ name: 'dashboard' });
        } else {
            errorMessage.value = 'Invalid username or password';
        }
    } catch (err) {
        console.error('Login failed:', err);
        errorMessage.value = 'An error occurred during login';
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <ProLoginPage
        appName="DO System"
        subtitle="Delivery order management"
        tagline="Accurate · Transparent · Reliable"
        taglineDescription="Your one-stop solution for managing delivery orders."
        logoSrc="/images/logo/prosync-p-logo.svg"
        illustrationSrc="/images/logo/DO_system.png"
        :loading="isLoading"
        :error="errorMessage"
        copyright="© 2026 Prosync DO System. All rights reserved."
        @login="handleLogin"
    />
</template>

<style scoped>
/* Force the native Prosync Login Card to organically scale down */
:deep(.pro-login-card) {
    max-height: 100vh;
    height: 100%;
    min-height: auto !important;
}

/* Shrink the illustration so it cleanly fits without expanding the card's height boundary */
:deep(.pro-login-brand__illustration img) {
    max-height: 56vh;
    width: auto;
    object-fit: contain;
}

/* Reduce tight padding on small screens to give elements breathing room */
:deep(.pro-login-brand) {
    padding: 2rem !important;
}

/* Force specific sizes to override legacy PrimeVue global resets */
:deep(.pro-login-form-header h1) {
    font-size: 32px !important;
    line-height: 40px !important;
}

:deep(.pro-login-form-header p),
:deep(.pro-login-form-header h2) {
    font-size: 16px !important;
    line-height: 24px !important;
    font-weight: 400 !important;
}
</style>
