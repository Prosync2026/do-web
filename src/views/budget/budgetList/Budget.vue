<script src="./Budget.script.ts"></script>

<template>
    <Teleport defer to="#page-header-actions">
        <div class="order-2">
            <ProSelect v-model="selectedVersion" :options="versionOptions" placeholder="Select Version" class="w-full md:w-64" />
        </div>
    </Teleport>

    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <ProCard padding="lg" class="mb-6">
            <!-- VIEW MODE TABS -->
            <ProTabs v-model="viewMode" :tabs="viewTabs">
                <div v-if="viewMode === 'overview'">
                    <Overview :budgetId="Number(latestBudgetId)" />
                </div>

                <div v-else-if="viewMode === 'detail'">
                    <!-- DETAIL SUB-VIEW BUTTONS -->
                    <div class="flex gap-2 mb-4">
                        <ProButton :variant="detailViewMode === 'list' ? 'primary' : 'secondary'" size="sm" @click="detailViewMode = 'list'">List View</ProButton>
                        <ProButton :variant="detailViewMode === 'tree' ? 'primary' : 'secondary'" size="sm" @click="detailViewMode = 'tree'">Tree Table Item Code View</ProButton>
                        <ProButton :variant="detailViewMode === 'treeLocation' ? 'primary' : 'secondary'" size="sm" @click="detailViewMode = 'treeLocation'">Tree Table Location View</ProButton>
                    </div>

                    <div v-if="detailViewMode === 'list'">
                        <BudgetList :budgetId="Number(latestBudgetId)" :budgetVersionCode="selectedNumericVersionCode" @success="handleImportSuccess" />
                    </div>

                    <div v-else-if="detailViewMode === 'tree'">
                        <HierarchyItemCode :budgetId="Number(latestBudgetId)" />
                    </div>

                    <div v-else-if="detailViewMode === 'treeLocation'">
                        <HierarchyLocation :budgetId="Number(latestBudgetId)" />
                    </div>
                </div>
            </ProTabs>
        </ProCard>
    </Motion>
</template>
