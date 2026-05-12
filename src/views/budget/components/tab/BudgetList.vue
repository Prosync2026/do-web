<script src="./BudgetList.script.ts"></script>

<template>
    <Teleport defer to="#page-header-actions">
        <div class="order-1">
            <ProButton v-if="showImportFile" variant="secondary" @click="handleImportClick">
                <PhUpload :size="18" class="mr-2" /> Import CSV
            </ProButton>
        </div>
    </Teleport>

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

                        <PhArrowRight :size="18" class="text-gray-400 text-sm mt-4"  />

                        <div class="flex flex-col gap-1">
                            <label class="text-xs text-gray-500 font-medium">To Version</label>
                            <ProSelect v-model="selectedToVersionCode" :options="availableVersionOptions" placeholder="Select To Version" class="w-56 h-9 text-sm" />
                        </div>
                    </div>

                    <!-- Resolved labels from API response -->
                    <div class="flex items-center gap-2 mt-3">
                        <ProTag :label="previousVersionLabel" variant="secondary" />
                        <PhArrowRight :size="18" class="text-gray-400 text-sm"  />
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
            <div class="flex flex-col gap-1 min-w-[150px]">
                <label class="text-xs text-gray-500 font-medium">Change Type</label>
                <ProSelect v-model="activeFilters.changeType" :options="changeTypeOptions" class="w-full text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Location 1 -->
            <div class="flex flex-col gap-1 min-w-[150px]">
                <label class="text-xs text-gray-500 font-medium">Location 1</label>
                <ProSelect v-model="activeFilters.location1" :options="filterOptions.locations1" placeholder="All" class="w-full text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Location 2 -->
            <div class="flex flex-col gap-1 min-w-[150px]">
                <label class="text-xs text-gray-500 font-medium">Location 2</label>
                <ProSelect v-model="activeFilters.location2" :options="filterOptions.locations2" placeholder="All" class="w-full text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Element -->
            <div class="flex flex-col gap-1 min-w-[150px]" v-if="filterOptions.elements.length">
                <label class="text-xs text-gray-500 font-medium">Element</label>
                <ProSelect v-model="activeFilters.element" :options="filterOptions.elements" placeholder="All" class="w-full text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Sub Element -->
            <div class="flex flex-col gap-1 min-w-[150px]" v-if="filterOptions.subElements.length">
                <label class="text-xs text-gray-500 font-medium">Sub Element</label>
                <ProSelect v-model="activeFilters.subElement" :options="filterOptions.subElements" placeholder="All" class="w-full text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Sub Sub Element -->
            <div class="flex flex-col gap-1 min-w-[150px]" v-if="filterOptions.subSubElements.length">
                <label class="text-xs text-gray-500 font-medium">Sub Sub Element</label>
                <ProSelect v-model="activeFilters.subSubElement" :options="filterOptions.subSubElements" placeholder="All" class="w-full text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1 min-w-[150px]" v-if="filterOptions.categories.length">
                <label class="text-xs text-gray-500 font-medium">Category</label>
                <ProSelect v-model="activeFilters.category" :options="filterOptions.categories" placeholder="All" class="w-full text-sm" @update:modelValue="handleFilterChange" />
            </div>

            <!-- Reset -->
            <div class="flex items-end">
                <ProButton variant="secondary" size="sm" @click="handleFilterReset">Reset</ProButton>
            </div>
        </div>
        <!-- Tables Area -->
        <div v-if="comparisonData">
            <!-- Mobile Search -->
            <div class="block lg:hidden mb-4 px-4">
                <ProInput :modelValue="search" @update:modelValue="(q) => { search = q; onSearchWrapper(q) }" placeholder="Search comparison..." class="w-full" />
            </div>

            <div class="flex items-center justify-between mb-4 px-4 lg:px-0">
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600 hidden lg:inline">Rows per page:</span>
                    <span class="text-sm text-gray-600 inline lg:hidden">Rows:</span>
                    <ProSelect :modelValue="pagination.pageSize" @update:modelValue="handlePageSizeChange" :options="pageSizeOptions" class="w-20 lg:w-24 h-9 text-sm" />
                </div>
            </div>

            <div class="hidden lg:block comparison-table-wrapper">
                <ProTable
                    :columns="proTableComparisonColumns"
                    :data="comparisonTable"
                    :pagination="{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total }"
                    :showRowIndex="true"
                    searchable
                    searchPlaceholder="Search..."
                    @search="(q) => { search = q; onSearchWrapper(search) }"
                    emptyTitle="Budget Comparison Data"
                    emptyDescription="No comparison data available."
                    @sort="handleProTableSort"
                    @update:pagination="handleProTablePaginationUpdate"
                >
                    <template #cell-wastage="{ row }">
                        <span v-if="row.wastage != null">{{ formatPercent(row.wastage * 100) }}</span>
                        <span v-else>-</span>
                    </template>
                    <template #cell-originalQty="{ row }">
                        {{ row.originalQty }}
                    </template>
                    <template #cell-originalRate="{ row }">
                        <span v-if="row.originalRate != null">RM {{ formatCurrency(row.originalRate) }}</span>
                        <span v-else>-</span>
                    </template>
                    <template #cell-originalAmount="{ row }">
                        <span :class="{ 'text-red-500': row.originalAmount < 0, 'text-green-500': row.originalAmount > 0 }"> <span v-if="row.originalAmount < 0">-</span>RM {{ formatCurrency(Math.abs(row.originalAmount || 0)) }} </span>
                    </template>
                    <template #cell-latestQty="{ row }">
                        {{ row.latestQty }}
                    </template>
                    <template #cell-latestRate="{ row }">
                        <span v-if="row.latestRate != null">RM {{ formatCurrency(row.latestRate) }}</span>
                        <span v-else>-</span>
                    </template>
                    <template #cell-latestAmount="{ row }">
                        <span :class="{ 'text-red-500': row.latestAmount < 0 }"> <span v-if="row.latestAmount < 0">-</span>RM {{ formatCurrency(Math.abs(row.latestAmount || 0)) }} </span>
                    </template>
                    <template #cell-amountDiff="{ row }">
                        <span :class="{ 'text-red-500': row.amountDiff < 0, 'text-green-500': row.amountDiff > 0 }"> <span v-if="row.amountDiff < 0">-</span>RM {{ formatCurrency(Math.abs(row.amountDiff || 0)) }} </span>
                    </template>
                    <template #actions="{ row }">
                        <ProButton variant="ghost" size="sm" @click="handleActionClick('edit', row)">
                            <PhPencil :size="18"  />
                        </ProButton>
                    </template>
                </ProTable>
            </div>

            <!-- Mobile Card View -->
            <div class="block lg:hidden px-4">
                <div v-if="comparisonTable.length === 0" class="text-center text-gray-500 py-6">No comparison data available.</div>
                <div v-else class="grid grid-cols-1 gap-4">
                    <ProCard v-for="row in comparisonTable" :key="row.itemCode" class="shadow-sm border border-gray-200 p-4">
                        <div class="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                            <div>
                                <span class="text-[10px] text-gray-500 uppercase tracking-wider block">Item Code</span>
                                <span class="font-semibold text-text-heading">{{ row.itemCode }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <ProTag
                                    :label="row.impact"
                                    :variant="row.impact === 'Added' ? 'success' : row.impact === 'Removed' ? 'error' : row.impact === 'Increase' ? 'warn' : 'info'"
                                />
                                <ProButton v-if="showImportFile" variant="ghost" size="sm" @click="handleActionClick('edit', row)">
                                    <PhPencil :size="16" />
                                </ProButton>
                            </div>
                        </div>
                        <div class="mb-2">
                            <span class="text-xs text-gray-500 block">Description</span>
                            <span class="text-sm font-medium">{{ row.description }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm mb-2 border-t border-gray-100 pt-2">
                            <div class="bg-gray-50 p-2 rounded">
                                <span class="text-xs font-semibold text-gray-600 block mb-1">Old Version</span>
                                <div class="flex justify-between"><span>Qty:</span> <span>{{ row.originalQty }}</span></div>
                                <div class="flex justify-between"><span>Rate:</span> <span>{{ row.originalRate != null ? 'RM ' + formatCurrency(row.originalRate) : '-' }}</span></div>
                                <div class="flex justify-between font-semibold mt-1 border-t border-gray-200 pt-1"><span>Amt:</span> <span>{{ row.originalAmount != null ? 'RM ' + formatCurrency(row.originalAmount) : '-' }}</span></div>
                            </div>
                            <div class="bg-blue-50 p-2 rounded">
                                <span class="text-xs font-semibold text-blue-700 block mb-1">New Version</span>
                                <div class="flex justify-between"><span>Qty:</span> <span>{{ row.latestQty }}</span></div>
                                <div class="flex justify-between"><span>Rate:</span> <span>{{ row.latestRate != null ? 'RM ' + formatCurrency(row.latestRate) : '-' }}</span></div>
                                <div class="flex justify-between font-semibold mt-1 border-t border-blue-200 pt-1"><span>Amt:</span> <span>{{ row.latestAmount != null ? 'RM ' + formatCurrency(row.latestAmount) : '-' }}</span></div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-2">
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-500">Δ Qty</span>
                                <span class="font-medium">{{ row.qtyDiff }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-500">Δ Amount</span>
                                <span class="font-medium" :class="row.amountDiff > 0 ? 'text-green-500' : row.amountDiff < 0 ? 'text-red-500' : ''">
                                    {{ row.amountDiff < 0 ? '-' : '' }}RM {{ formatCurrency(Math.abs(row.amountDiff || 0)) }}
                                </span>
                            </div>
                        </div>
                    </ProCard>
                </div>
                <div class="mt-6 flex justify-center pb-4">
                    <ProPagination :modelValue="pagination.page" :totalPages="pagination.totalPages" @update:modelValue="handlePageChange" />
                </div>
            </div>
        </div>

        <div v-else>
            <!-- Mobile Search -->
            <div class="block lg:hidden mb-4 px-4">
                <ProInput :modelValue="search" @update:modelValue="(q) => { search = q; onSearchWrapper(q) }" placeholder="Search budget items..." class="w-full" />
            </div>

            <div class="flex items-center justify-between mb-4 px-4 lg:px-0">
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600 hidden lg:inline">Rows per page:</span>
                    <span class="text-sm text-gray-600 inline lg:hidden">Rows:</span>
                    <ProSelect :modelValue="pagination.pageSize" @update:modelValue="handlePageSizeChange" :options="pageSizeOptions" class="w-20 lg:w-24 text-sm" />
                </div>
            </div>

            <div class="hidden lg:block">
                <ProTable
                    :columns="proTableBudgetColumns"
                    :data="filteredItems"
                    :pagination="{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total }"
                    :showRowIndex="true"
                    searchable
                    searchPlaceholder="Search..."
                    @search="(q) => { search = q; onSearchWrapper(search) }"
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
                            <PhPencil :size="18"  />
                        </ProButton>
                    </template>
                </ProTable>
            </div>

            <!-- Mobile Card View -->
            <div class="block lg:hidden px-4">
                <div v-if="filteredItems.length === 0" class="text-center text-gray-500 py-6">No budget items found.</div>
                <div v-else class="grid grid-cols-1 gap-4">
                    <ProCard v-for="row in filteredItems" :key="row.itemCode" class="shadow-sm border border-gray-200 p-4">
                        <div class="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                            <div>
                                <span class="text-[10px] text-gray-500 uppercase tracking-wider block">Item Code</span>
                                <span class="font-semibold text-text-heading">{{ row.itemCode }}</span>
                            </div>
                            <ProButton v-if="showImportFile" variant="ghost" size="sm" @click="handleActionClick('edit', row)">
                                <PhPencil :size="16" />
                            </ProButton>
                        </div>
                        <div class="mb-2">
                            <span class="text-xs text-gray-500 block">Description</span>
                            <span class="text-sm font-medium">{{ row.description }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mb-2 text-sm">
                            <div>
                                <span class="text-xs text-gray-500 block">Location 1</span>
                                <span>{{ row.location1 || '-' }}</span>
                            </div>
                            <div>
                                <span class="text-xs text-gray-500 block">Location 2</span>
                                <span>{{ row.location2 || '-' }}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 mb-2 text-sm border-t border-gray-100 pt-2">
                            <div>
                                <span class="text-xs text-gray-500 block">Qty</span>
                                <span>{{ row.qty }} {{ row.unit }}</span>
                            </div>
                            <div>
                                <span class="text-xs text-gray-500 block">Rate</span>
                                <span>RM {{ formatCurrency(row.rate) }}</span>
                            </div>
                            <div>
                                <span class="text-xs text-gray-500 block">Amount</span>
                                <span class="font-semibold text-text-heading">RM {{ formatCurrency(row.amount) }}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-2">
                            <div>
                                <span class="text-xs text-gray-500 block">Ordered</span>
                                <span>{{ row.totalOrderedQty || '-' }}</span>
                            </div>
                            <div>
                                <span class="text-xs text-gray-500 block">Remaining</span>
                                <div class="flex items-center gap-1">
                                    <span>{{ row.totalRemainingQty ?? '-' }}</span>
                                    <span class="px-1.5 py-0.5 text-[10px] font-medium rounded whitespace-nowrap" :class="getUtilizationClass(row.utilizationOrdered)">
                                        {{ formatPercent(row.utilizationOrdered) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </ProCard>
                </div>
                <div class="mt-6 flex justify-center pb-4">
                    <ProPagination :modelValue="pagination.page" :totalPages="pagination.totalPages" @update:modelValue="handlePageChange" />
                </div>
            </div>
        </div>
    </div>
    <BudgetImportModal :visible="showImportModal" @close="showImportModal = false" @success="handleImportSuccess" />
    <EditBudgetItem v-model:visible="showEditModal" :item="selectedEditItem" @success="handleEditSuccess" />
    <ConfirmPopup />
</template>

<style scoped>
/* Old Qty, Old Rate, Old Amount columns (12th, 13th, 14th) — grey background */
.comparison-table-wrapper :deep(table th:nth-child(12)),
.comparison-table-wrapper :deep(table td:nth-child(12)),
.comparison-table-wrapper :deep(table th:nth-child(13)),
.comparison-table-wrapper :deep(table td:nth-child(13)),
.comparison-table-wrapper :deep(table th:nth-child(14)),
.comparison-table-wrapper :deep(table td:nth-child(14)) {
    background-color: #f3f4f6; /* gray-100 */
}

/* New Qty, New Rate, New Amount columns (15th, 16th, 17th) — blue background */
.comparison-table-wrapper :deep(table th:nth-child(15)),
.comparison-table-wrapper :deep(table td:nth-child(15)),
.comparison-table-wrapper :deep(table th:nth-child(16)),
.comparison-table-wrapper :deep(table td:nth-child(16)),
.comparison-table-wrapper :deep(table th:nth-child(17)),
.comparison-table-wrapper :deep(table td:nth-child(17)) {
    background-color: #eff6ff; /* blue-50 */
}
</style>
