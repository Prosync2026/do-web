<script src="./BudgetList.script.ts"></script>

<template>
    <div>
        <!-- Budget Version Comparison -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h2 class="text-lg font-semibold mb-2">Budget Version Comparison</h2>

                    <div class="flex items-center gap-2">
                        <Tag :value="previousVersionLabel" severity="secondary" class="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200" rounded />
                        <i class="pi pi-arrow-right text-gray-400 text-sm"></i>
                        <Tag :value="currentVersionLabel" severity="info" class="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200" rounded />
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

        <ReusableTable
            v-if="comparisonTable.length > 0"
            :value="comparisonTable"
            :columns="comparisonColumns"
            :searchValue="search"
            emptyTitle="Budget Comparison Data"
            :pagination="pagination"
            :onPageChange="handlePageChange"
            :onPageSizeChange="handlePageSizeChange"
            :onSortChange="handleSortChange"
            :sortField="currentSortField"
            :sortOrder="currentSortOrder"
            :filters="filters"
            @search="onSearchWrapper"
            :showImportFile="showImportFile"
            :onImportFile="handleImportClick"
            dataKey="itemCode"
        >
            <template #amount="{ data, field }">
                <span :class="{ 'text-red-500': data[field] < 0, 'text-green-500': data[field] > 0 }"> <span v-if="data[field] < 0">-</span>RM {{ formatCurrency(Math.abs(data[field] || 0)) }} </span>
            </template>
            <template #impact="{ data }">
                <Tag :value="data.impact" :severity="data.impact === 'Added' ? 'success' : data.impact === 'Removed' ? 'danger' : data.impact === 'Increase' ? 'warning' : 'info'" />
            </template>
        </ReusableTable>

        <ReusableTable
            v-else
            :value="filteredItems"
            :columns="columns"
            :searchValue="search"
            emptyTitle="Budget List Data"
            :pagination="pagination"
            :onPageChange="handlePageChange"
            :onPageSizeChange="handlePageSizeChange"
            :onSortChange="handleSortChange"
            :sortField="currentSortField"
            :sortOrder="currentSortOrder"
            :filters="filters"
            :search="search"
            @search="onSearchWrapper"
            :showImportFile="showImportFile"
            :onImportFile="handleImportClick"
        >
            <template #remainingQty="{ data }">
                <div class="flex flex-col gap-1">
                    <!-- Remaining Qty -->
                    <span> {{ data.totalRemainingQty ?? '-' }} </span>

                    <!-- Utilization Badge -->
                    <span class="px-2 py-0.5 text-xs font-medium rounded w-fit" :class="getUtilizationClass(data.utilizationOrdered)">
                        {{ formatPercent(data.utilizationOrdered) }}
                    </span>
                </div>
            </template>

            <template #rate="{ data }"> RM {{ formatCurrency(data.rate) }} </template>
            <template #amount="{ data }"> RM {{ formatCurrency(data.amount) }} </template>
        </ReusableTable>
    </div>
    <BudgetImportModal :visible="showImportModal" @close="showImportModal = false" @success="handleImportSuccess" />
    <ConfirmPopup />
</template>
