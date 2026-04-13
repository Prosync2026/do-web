<script lang="ts" src="./SummaryCard.script.ts"></script>

<template>
    <div v-for="item in cardItems" :key="item.title" class="col-span-12 lg:col-span-6" :class="cardColClass">
        <ProCard padding="sm" :shadow="false">
            <div class="flex justify-between items-center">
                <span class="block text-muted-color font-bold text-lg">
                    {{ item.title }}
                </span>
                <div class="flex items-center justify-center rounded-full w-6 h-6" :class="`bg-${item.color}-100 dark:bg-${item.color}-400/10`">
                    <i :class="[item.icon, `text-${item.color}-500`, 'text-xs']"></i>
                </div>
            </div>
            <div class="font-medium text-xl dark:text-surface-0 mt-4" :class="`text-${item.color}-500`">
                {{ item.value }}
            </div>
            <span class="text-muted-color">{{ item.description }}</span>
        </ProCard>
    </div>
</template>
