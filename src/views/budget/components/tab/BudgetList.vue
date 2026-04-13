<script src="./BudgetList.script.ts"></script>

<template>
    <div>
        <!-- Budget Version Comparison -->
        <div class="mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                    <h2 class="text-lg font-semibold mb-3">Budget Version Comparison</h2>

                    <!-- Version Selectors -->
                    <div class="flex items-center gap-3 flex-wrap">
                        <div class="flex flex-col gap-1">
                            <label class="text-xs text-gray-500 font-medium">From Version</label>
                            <ProSelect v-model="selectedFromVersionCode" :options="availableVersionOptions" placeholder="Select From Version" class="w-56 h-9 text-sm" />
                        </div>

                        <i class="pi pi-arrow-right text-gray-400 text-sm mt-4"></i>

                        <div class="flex flex-col gap-1">
                            <label class="text-xs text-gray-500 font-medium">To Version</label>
                            <ProSelect v-model="selectedToVersionCode" :options="availableVersionOptions" placeholder="Select To Version" class="w-56 h-9 text-sm" />
                        </div>
                    </div>

                    <!-- Resolved labels from API response -->
                    <div class="flex items-center gap-2 mt-3">
                        <ProTag :label="previousVersionLabel" variant="secondary" />
                        <i class="pi pi-arrow-right text-gray-400 text-sm"></i>
                        <ProTag :label="currentVersionLabel" variant="info" />
                    </div>
                </div>
            </div>

            <!-- Impact Summary -->
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="p-4 rounded-lg bg-gray-50">
                    <p class="text-xs text-gray-500">Total Items</p>
                    <p class="text-lg font-semibold text-gray-700">{{ impactSummary.totalItems }}</p>
                </div>

                <div class="p-4 rounded-lg bg-green-50">
                    <p class="text-xs text-gray-500">New Items</p>
                    <p class="text-lg font-semibold text-green-600">{{ impactSummary.newItems }}</p>
                </div>

                <div class="p-4 rounded-lg bg-red-50">
                    <p class="text-xs text-gray-500">Removed Items</p>
                    <p class="text-lg font-semibold text-red-600">{{ impactSummary.removedItems }}</p>
                </div>
            </div>
        </div>
        <!-- Filters Row -->
        <div class="flex flex-wrap gap-3 mb-5 p-4">
            <!-- Change Type -->
            <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-500 font-medium">Change Type</label>
                <ProSelect v-model="activeFilters.changeType" :options="changeTypeOptions" class="min-w-[180px] text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Location 1 -->
            <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-500 font-medium">Location 1</label>
                <ProSelect v-model="activeFilters.location1" :options="filterOptions.locations1" placeholder="All" class="min-w-[180px] text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Location 2 -->
            <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-500 font-medium">Location 2</label>
                <ProSelect v-model="activeFilters.location2" :options="filterOptions.locations2" placeholder="All" class="min-w-[180px] text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Element -->
            <div class="flex flex-col gap-1" v-if="filterOptions.elements.length">
                <label class="text-xs text-gray-500 font-medium">Element</label>
                <ProSelect v-model="activeFilters.element" :options="filterOptions.elements" placeholder="All" class="min-w-[180px] text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1" v-if="filterOptions.categories.length">
                <label class="text-xs text-gray-500 font-medium">Category</label>
                <ProSelect v-model="activeFilters.category" :options="filterOptions.categories" placeholder="All" class="min-w-[180px] text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Reset -->
            <div class="flex items-end">
                <ProButton variant="secondary" size="sm" @click="handleFilterReset">Reset</ProButton>
            </div>
        </div>
        <div v-if="comparisonData">
            <!-- Toolbar: Search + Page Size + Import -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">Rows per page:</span>
                    <ProSelect :modelValue="pagination.pageSize" @update:modelValue="handlePageSizeChange" :options="pageSizeOptions" class="w-24 h-9 text-sm" />
                </div>
                <div class="flex gap-2 items-center">
                    <ProInput v-model="search" placeholder="Search..." class="w-64" @keyup.enter="onSearchWrapper(search)" />
                    <ProButton v-if="showImportFile" variant="secondary" @click="handleImportClick"> <i class="pi pi-upload mr-2"></i> Import CSV </ProButton>
                </div>
            </div>

            <div class="comparison-table-wrapper">
                <ProTable
                    :columns="proTableComparisonColumns"
                    :data="comparisonTable"
                    :pagination="{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total }"
                    :showRowIndex="true"
                    emptyTitle="Budget Comparison Data"
                    emptyDescription="No comparison data available."
                    @sort="handleProTableSort"
                    @update:pagination="handleProTablePaginationUpdate"
                >
                    <template #cell-originalQty="{ row }">
                        {{ row.originalQty }}
                    </template>
                    <template #cell-originalAmount="{ row }">
                        <span :class="{ 'text-red-500': row.originalAmount < 0, 'text-green-500': row.originalAmount > 0 }"> <span v-if="row.originalAmount < 0">-</span>RM {{ formatCurrency(Math.abs(row.originalAmount || 0)) }} </span>
                    </template>
                    <template #cell-latestQty="{ row }">
                        {{ row.latestQty }}
                    </template>
                    <template #cell-latestAmount="{ row }">
                        <span :class="{ 'text-red-500': row.latestAmount < 0 }"> <span v-if="row.latestAmount < 0">-</span>RM {{ formatCurrency(Math.abs(row.latestAmount || 0)) }} </span>
                    </template>
                    <template #cell-amountDiff="{ row }">
                        <span :class="{ 'text-red-500': row.amountDiff < 0, 'text-green-500': row.amountDiff > 0 }"> <span v-if="row.amountDiff < 0">-</span>RM {{ formatCurrency(Math.abs(row.amountDiff || 0)) }} </span>
                    </template>
                    <template #actions="{ row }">
                        <ProButton variant="ghost" size="sm" @click="handleActionClick('edit', row)">
                            <i class="pi pi-pencil"></i>
                        </ProButton>
                    </template>
                </ProTable>
            </div>
        </div>

        <div v-else>
            <!-- Toolbar: Search + Page Size + Import -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">Rows per page:</span>
                    <ProSelect :modelValue="pagination.pageSize" @update:modelValue="handlePageSizeChange" :options="pageSizeOptions" class="w-24 text-sm" />
                </div>
                <div class="flex gap-2 items-center">
                    <ProInput v-model="search" placeholder="Search..." class="w-64" @keyup.enter="onSearchWrapper(search)" />
                    <ProButton v-if="showImportFile" variant="secondary" @click="handleImportClick"> <i class="pi pi-upload mr-2"></i> Import CSV </ProButton>
                </div>
            </div>

            <ProTable
                :columns="proTableBudgetColumns"
                :data="filteredItems"
                :pagination="{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total }"
                :showRowIndex="true"
                emptyTitle="Budget List Data"
                emptyDescription="No budget items found."
                @sort="handleProTableSort"
                @update:pagination="handleProTablePaginationUpdate"
            >
                <template #cell-totalRemainingQty="{ row }">
                    <div class="flex flex-col gap-1">
                        <span>{{ row.totalRemainingQty ?? '-' }}</span>
                        <span class="px-2 py-0.5 text-xs font-medium rounded w-fit" :class="getUtilizationClass(row.utilizationOrdered)">
                            {{ formatPercent(row.utilizationOrdered) }}
                        </span>
                    </div>
                </template>

                <template #cell-rate="{ row }">RM {{ formatCurrency(row.rate) }}</template>
                <template #cell-amount="{ row }">RM {{ formatCurrency(row.amount) }}</template>

                <template #actions="{ row }">
                    <ProButton variant="ghost" size="sm" @click="handleActionClick('edit', row)">
                        <i class="pi pi-pencil"></i>
                    </ProButton>
                </template>
            </ProTable>
        </div>
    </div>
    <BudgetImportModal :visible="showImportModal" @close="showImportModal = false" @success="handleImportSuccess" />
    <EditBudgetItem v-model:visible="showEditModal" :item="selectedEditItem" @success="handleEditSuccess" />
    <ConfirmPopup />
</template>

<style scoped>
/* Old Qty & Old Amount columns (10th, 11th) — grey background */
.comparison-table-wrapper :deep(table th:nth-child(10)),
.comparison-table-wrapper :deep(table td:nth-child(10)),
.comparison-table-wrapper :deep(table th:nth-child(11)),
.comparison-table-wrapper :deep(table td:nth-child(11)) {
    background-color: #f3f4f6; /* gray-100 */
}

/* New Qty & New Amount columns (12th, 13th) — blue background */
.comparison-table-wrapper :deep(table th:nth-child(12)),
.comparison-table-wrapper :deep(table td:nth-child(12)),
.comparison-table-wrapper :deep(table th:nth-child(13)),
.comparison-table-wrapper :deep(table td:nth-child(13)) {
    background-color: #eff6ff; /* blue-50 */
}
</style>
