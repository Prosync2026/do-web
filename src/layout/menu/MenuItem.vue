<script setup>
import { useLayout } from '@/layout/composables/layout';
import { Badge } from 'primevue';
import { PhCaretDown } from '@phosphor-icons/vue';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();

const { layoutState, setActiveMenuItem, toggleMenu } = useLayout();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },

    parentItemKey: {
        type: String,
        default: null
    }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(itemKey.value + '-') : false;
});

watch(
    () => layoutState.activeMenuItem,
    (newVal) => {
        isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(itemKey.value + '-');
    }
);

function itemClick(event, item) {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    if ((item.to || item.url) && (layoutState.staticMenuMobileActive || layoutState.overlayMenuActive)) {
        toggleMenu();
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey) : itemKey.value;

    setActiveMenuItem(foundItemKey);
}

function checkActiveRoute(item) {
    return route.path === item.to;
}
</script>
<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>

        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item, index)" :class="item.class" :target="item.target" tabindex="0">
            <div class="relative flex items-center mr-2">
                <component :is="item.icon" :size="20" class="layout-menuitem-icon !m-0"></component>
                <Badge v-if="Number(item.badge) > 0" :value="item.badge" class="!bg-primary !text-white absolute shadow-sm pointer-events-none" style="top: -6px; right: -8px; transform: scale(0.75); transform-origin: top right" />
            </div>
            
            <span class="layout-menuitem-text flex justify-between items-center w-full">
                <span>{{ item.label }}</span>
                <!-- Replace Badge with icon -->
                <component v-if="item.badgeIcon" :is="item.badgeIcon" :size="16" style="color: #0b55f5"></component>
            </span>
            <PhCaretDown class="layout-submenu-toggler" :size="16" weight="bold" v-if="item.items" />
        </a>

        <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0" :to="item.to">
            <div class="relative flex items-center mr-2">
                <component :is="item.icon" :size="20" class="layout-menuitem-icon !m-0"></component>
                <Badge v-if="Number(item.badge) > 0" :value="item.badge" class="!bg-primary !text-white absolute shadow-sm pointer-events-none" style="top: -6px; right: -8px; transform: scale(0.75); transform-origin: top right" />
            </div>
            
            <span class="layout-menuitem-text flex justify-between items-center w-full">
                <span>{{ item.label }}</span>
                <!-- Replace Badge with icon -->
                <component v-if="item.badgeIcon" :is="item.badgeIcon" :size="16" style="color: #0b55f5"></component>
            </span>
            <PhCaretDown class="layout-submenu-toggler" :size="16" weight="bold" v-if="item.items" />
        </router-link>

        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <menu-item v-for="(child, i) in item.items" :key="i" :index="i" :item="child" :parentItemKey="itemKey" :root="false" />
            </ul>
        </Transition>
    </li>
</template>
