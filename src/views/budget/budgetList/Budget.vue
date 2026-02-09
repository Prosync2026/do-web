<script src="./Budget.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card mb-6">
            <BreadcrumbList />

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 class="text-2xl font-bold dark:text-white">Budget Management</h1>
                    <p class="text-gray-500 dark:text-white">Interactive charts showing budget distribution.</p>
                </div>
                <div class="flex items-center gap-2 w-full md:w-auto">
                    <Dropdown v-model="selectedVersion" :options="versions" optionLabel="label" optionValue="value" class="w-full md:w-64 h-10 rounded-lg" placeholder="Select Version">
                        <template #option="slotProps">
                            <div class="flex items-center">
                                <span>{{ slotProps.option.label }}</span>
                                <Badge v-if="slotProps.option.latest" value="Latest" severity="primary" class="ml-2" />
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div class="flex items-center" v-if="slotProps.value">
                                <span>{{ versions.find((v) => v.value === slotProps.value)?.label }}</span>
                                <Badge v-if="versions.find((v) => v.value === slotProps.value)?.latest" value="Latest" severity="primary" class="ml-2" />
                            </div>
                            <span v-else class="text-gray-400">Select Version</span>
                        </template>
                    </Dropdown>
                </div>
            </div>

            <!-- VIEW MODE SELECT -->
            <SelectButton v-model="viewMode" :options="viewOptions" optionLabel="label" optionValue="value" class="h-10 rounded-lg" />

            <!-- DETAIL SUB-VIEW BUTTONS -->
            <div v-if="viewMode === 'detail'" class="flex gap-2 mt-2 mb-4">
                <Button label="List View" icon="pi pi-list" :outlined="detailViewMode !== 'list'" @click="detailViewMode = 'list'" />
                <Button label="Tree Table Item Code View" icon="pi pi-sitemap" :outlined="detailViewMode !== 'tree'" @click="detailViewMode = 'tree'" />
                <Button label="Tree Table Location View" icon="pi pi-map" :outlined="detailViewMode !== 'treeLocation'" @click="detailViewMode = 'treeLocation'" />
            </div>

            <div v-if="viewMode === 'overview'">
                <Overview :budgetId="Number(latestBudgetId)" />
            </div>

            <div v-else-if="detailViewMode === 'list'">
                <BudgetList :budgetId="Number(latestBudgetId)" @success="handleImportSuccess" />
            </div>

            <div v-else-if="detailViewMode === 'tree'">
                <HierarchyItemCode :budgetId="Number(latestBudgetId)" />
            </div>

            <div v-else-if="detailViewMode === 'treeLocation'">
                <HierarchyLocation :budgetId="Number(latestBudgetId)" />
            </div>
        </div>
    </Motion>
</template>
