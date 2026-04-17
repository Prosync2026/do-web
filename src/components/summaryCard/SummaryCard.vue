<script lang="ts" src="./SummaryCard.script.ts"></script>

<template>
    <div v-for="item in cardItems" :key="item.title" class="col-span-12 lg:col-span-6" :class="cardColClass">
        <ProStatisticCard
            :label="item.title"
            :value="item.value"
            :subtitle="item.description"
            :icon="item.icon"
            :iconBg="`bg-${item.color}-100 dark:bg-${item.color}-400/10 text-${item.color}-500`"
        />
    </div>
</template>
