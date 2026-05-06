<script setup lang="ts">
import { usePageHeaderState } from '@/composables/usePageHeader';
import { useLayout } from '@/layout/composables/layout';
import { ProPageHeader } from '@prosync_solutions/ui';
import Toast from 'primevue/toast';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const { isSidebarActive, layoutState } = useLayout();
const route = useRoute();
const { pageHeaderState } = usePageHeaderState();

const pageTitle = computed(() => {
    if (pageHeaderState.title) return pageHeaderState.title;
    const meta = (route.meta.breadcrumb ?? []) as any[];
    if (meta.length > 0) return meta[meta.length - 1].label;
    return '';
});

const pageSubtitle = computed(() => {
    if (pageHeaderState.subtitle) return pageHeaderState.subtitle;
    return (route.meta.subtitle as string) || '';
});

const breadcrumbs = computed(() => {
    if (pageHeaderState.breadcrumbs.length > 0) {
        return pageHeaderState.breadcrumbs.map(b => ({
            label: b.label,
            to: b.to || b.route
        }));
    }

    const meta = (route.meta.breadcrumb ?? []) as any[];
    if (meta.length <= 1) return [];

    return meta.map((item, index) => {
        const isLast = index === meta.length - 1;
        return {
            label: item.label,
            ...(isLast ? {} : { to: item.route || item.to })
        };
    });
});

const outsideClickListener = ref<((event: Event) => void) | null>(null);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.staticMenuMobileActive = false;
                layoutState.overlayMenuActive = false;
                layoutState.menuHoverActive = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event: Event) {
    const sidebarEl = document.querySelector('aside');
    const topbarBtnEl = document.querySelector('.layout-menu-button');

    return !((sidebarEl && (sidebarEl.isSameNode(event.target as Node) || sidebarEl.contains(event.target as Node))) || (topbarBtnEl && (topbarBtnEl.isSameNode(event.target as Node) || topbarBtnEl.contains(event.target as Node))));
}

// Ensure overlay panel class logic works just in case layout config is requested elsewhere
const containerClass = computed(() => {
    return {
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});
</script>

<template>
    <div class="flex h-screen overflow-hidden bg-surface-main-bg" :class="containerClass">
        <AppSidebar />

        <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
            <AppTopbar />

            <main class="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
                <ProPageHeader v-if="pageTitle" :title="pageTitle" :subtitle="pageSubtitle" :breadcrumbs="breadcrumbs" class="mb-4">
                    <template #actions>
                        <div id="page-header-actions" class="flex items-center justify-end gap-3"></div>
                    </template>
                </ProPageHeader>
                <router-view :key="route.path"></router-view>
            </main>
        </div>

        <div v-if="layoutState.staticMenuMobileActive" class="fixed inset-0 bg-black/60 z-40 md:hidden" @click="layoutState.staticMenuMobileActive = false"></div>
    </div>
    </template>

<style scoped>
/* No more complex scoped SCSS; replaced by Tailwind flex layout */
</style>
