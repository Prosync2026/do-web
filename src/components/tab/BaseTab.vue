<script lang="ts">
import { defineComponent, PropType } from 'vue';

type TabItem = {
    value: string;
    label: string;
    badge?: number;
};

export default defineComponent({
    name: 'BaseTab',
    props: {
        tabs: {
            type: Array as PropType<TabItem[]>,
            required: true
        },
        modelValue: {
            type: String,
            required: true
        }
    },
    emits: ['update:modelValue'],
    setup() {
        // badge colors
        const badgeColors = ['bg-yellow-500', 'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500'];

        // color based on tab index
        const getBadgeColor = (index: number) => {
            return badgeColors[index % badgeColors.length];
        };

        return { getBadgeColor };
    }
});
</script>

<template>
    <div class="custom-tabs flex space-x-2">
        <button v-for="(tab, index) in tabs" :key="tab.value" :class="['custom-tab dark:text-white px-4 py-2 rounded-lg', { active: modelValue === tab.value }]" @click="$emit('update:modelValue', tab.value)">
            <span>{{ tab.label }}</span>
            <span v-if="tab.badge" :class="['ml-2 inline-block text-white text-xs font-semibold px-2 py-0.5 rounded-full', getBadgeColor(index)]">
                {{ tab.badge }}
            </span>
        </button>
    </div>

    <div class="tab-content mt-4">
        <slot :activeTab="modelValue" />
    </div>
</template>
