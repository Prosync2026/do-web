<script setup lang="ts">
import CartWithBadge from '@/components/icons/CartWithBadge.vue';
import { useLayout } from '@/layout/composables/layout';
import { PermissionCodes } from '@/permissions';
import { usePermissionStore } from '@/stores/permission/permission.store';
import { Motion } from '@motionone/vue';
import { PhBook, PhChartBar, PhHouse, PhTag, PhTicket, PhTruck, PhWrench } from '@phosphor-icons/vue';
import { ProSidebar } from '@prosync_solutions/ui';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const username = ref<string | null>(null);
const role = ref<string | null>(null);

// Permission & Store logic migrated from Menu.script.ts
const permissionStore = usePermissionStore();

const canViewRO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_REQUEST_ORDER));
const canViewBudget = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_BUDGET));
const canViewPO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_PURCHASE_ORDER));
const canViewDelivery = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_DELIVERY_ORDER));

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

const isSidebarExpanded = ref(!isMobile.value);

const checkMobile = () => {
    isMobile.value = window.innerWidth < 1024;
    if (isMobile.value) {
        isSidebarExpanded.value = false;
    } else {
        isSidebarExpanded.value = true;
    }
};

watch(() => route.path, () => {
    if (isMobile.value) {
        isSidebarExpanded.value = false;
    }
});

const sidebarWrapper = ref<HTMLElement | null>(null);

const handleSidebarClick = (e: MouseEvent) => {
    if (isMobile.value && !isSidebarExpanded.value) {
        if (sidebarWrapper.value) {
            const buttons = Array.from(sidebarWrapper.value.querySelectorAll('button'));
            
            // The toggle button in ProSidebar is typically the only button with NO text content (just an SVG icon).
            const toggleBtn = buttons.find(btn => btn.textContent?.trim() === '');
            
            const target = e.target as HTMLElement;
            const clickedBtn = target.closest('button');
            
            if (toggleBtn && clickedBtn === toggleBtn) {
                // User clicked the expand/collapse button manually, so let the native behavior run!
                return;
            }
            
            if (toggleBtn) {
                toggleBtn.click();
            }
        }
    }
};

onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const parsed = JSON.parse(user);
            username.value = parsed.username;
            role.value = parsed.role;
        } catch {
            username.value = user;
            role.value = null;
        }
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
});

// Build the NavItems matching ProSidebar schema
// Flattening the outmost root array to match ProSidebar's direct list format
const navItems = computed(() =>
    [
        { label: 'Dashboard', icon: PhHouse, to: '/' },
        {
            label: 'Budget',
            icon: PhChartBar,
            visible: canViewBudget.value,
            children: [
                { label: 'Budget List', icon: PhTicket, to: '/budget' },
                { label: 'Budget Change Request', icon: PhTag, to: '/bcr' }
            ]
        },
        {
            label: 'Request Orders',
            icon: CartWithBadge,
            to: '/request-orders',
            visible: canViewRO.value
        },
        {
            label: 'Purchase Orders',
            icon: PhBook,
            to: '/purchase-orders',
            visible: canViewPO.value,
            badgeIcon: PhWrench
        },
        {
            label: 'Deliveries',
            icon: PhTruck,
            to: '/deliveries',
            visible: canViewDelivery.value,
            badgeIcon: PhWrench
        }
    ].filter((item) => item.visible !== false)
);
</script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }" tag="div" class="relative z-[60]">
        <div class="h-screen bg-white" ref="sidebarWrapper" @click.capture="handleSidebarClick">
            <ProSidebar :key="`${route.path}-${isMobile}`" :nav-items="navItems" :expanded="isSidebarExpanded" :default-expanded="!isMobile" :persist-state="false" @update:expanded="isSidebarExpanded = $event">
                <template #logo="{ isExpanded }">
                    <router-link to="/" class="flex items-center justify-center p-1">
                        <h1 v-if="isExpanded" class="text-2xl font-extrabold leading-tight m-0 text-brand-primary truncate w-full text-center">DO SYSTEM</h1>
                        <h1 v-else class="text-2xl font-extrabold leading-tight m-0 text-brand-primary">DO</h1>
                    </router-link>
                </template>
            </ProSidebar>
        </div>
    </Motion>
</template>
