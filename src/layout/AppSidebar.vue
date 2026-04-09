<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { PermissionCodes } from '@/permissions';
import { usePermissionStore } from '@/stores/permission/permission.store';
import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';
import { PhBook, PhChartBar, PhHouse, PhShoppingCart, PhTag, PhTicket, PhTruck, PhWrench } from '@phosphor-icons/vue';
import { ProSidebar } from '@prosync_solutions/ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const username = ref<string | null>(null);
const role = ref<string | null>(null);

// Permission & Store logic migrated from Menu.script.ts
const permissionStore = usePermissionStore();
const roStore = useRequestOrderStore();

const canViewRO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_REQUEST_ORDER));
const canViewBudget = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_BUDGET));
const canViewPO = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_PURCHASE_ORDER));
const canViewDelivery = computed(() => permissionStore.hasPermission(PermissionCodes.VIEW_DELIVERY_ORDER));

onMounted(() => {
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

// Build the NavItems matching ProSidebar schema
// Flattening the outmost root array to match ProSidebar's direct list format
const navItems = computed(() => [
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
        icon: PhShoppingCart,
        to: '/request-orders',
        badge: roStore.pendingCount,
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
].filter(item => item.visible !== false));

</script>

<template>
    <div class="h-screen bg-white">
        <ProSidebar :key="route.path" :nav-items="navItems" :default-expanded="true" :persist-state="false">
            <template #logo="{ isExpanded }">
                <router-link to="/" class="flex items-center justify-center p-1">
                    <h1 v-if="isExpanded" class="text-2xl font-extrabold leading-tight m-0 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent truncate w-full text-center">DO SYSTEM</h1>
                    <h1 v-else class="text-2xl font-extrabold leading-tight m-0 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">DO</h1>
                </router-link>
            </template>
        </ProSidebar>
    </div>
</template>
