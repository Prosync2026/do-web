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
                            <Dropdown v-model="selectedFromVersionCode" :options="availableVersionOptions" optionLabel="label" optionValue="value" placeholder="Select From Version" class="w-56 h-9 text-sm" />
                        </div>

                        <i class="pi pi-arrow-right text-gray-400 text-sm mt-4"></i>

                        <div class="flex flex-col gap-1">
                            <label class="text-xs text-gray-500 font-medium">To Version</label>
                            <Dropdown v-model="selectedToVersionCode" :options="availableVersionOptions" optionLabel="label" optionValue="value" placeholder="Select To Version" class="w-56 h-9 text-sm" />
                        </div>
                    </div>

                    <!-- Resolved labels from API response -->
                    <div class="flex items-center gap-2 mt-3">
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
        <!-- Filters Row -->
        <div class="flex flex-wrap gap-3 mb-5 p-4">
            <!-- Change Type -->
            <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-500 font-medium">Change Type</label>
                <Dropdown v-model="activeFilters.changeType" :options="changeTypeOptions" optionLabel="label" optionValue="value" class="w-40 h-9 text-sm" @change="handleFilterChange" />
            </div>

            <!-- Location 1 -->
            <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-500 font-medium">Location 1</label>
                <Dropdown v-model="activeFilters.location1" :options="filterOptions.locations1" placeholder="All" showClear class="w-36 h-9 text-sm" @change="handleFilterChange" />
            </div>

            <!-- Location 2 -->
            <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-500 font-medium">Location 2</label>
                <Dropdown v-model="activeFilters.location2" :options="filterOptions.locations2" placeholder="All" showClear class="w-40 h-9 text-sm" @change="handleFilterChange" />
            </div>

            <!-- Element -->
            <div class="flex flex-col gap-1" v-if="filterOptions.elements.length">
                <label class="text-xs text-gray-500 font-medium">Element</label>
                <Dropdown v-model="activeFilters.element" :options="filterOptions.elements" placeholder="All" showClear class="w-40 h-9 text-sm" @change="handleFilterChange" />
            </div>

            <!-- Category -->
            <div class="flex flex-col gap-1" v-if="filterOptions.categories.length">
                <label class="text-xs text-gray-500 font-medium">Category</label>
                <Dropdown v-model="activeFilters.category" :options="filterOptions.categories" placeholder="All" showClear class="w-40 h-9 text-sm" @change="handleFilterChange" />
            </div>

            <!-- Reset -->
            <div class="flex items-end">
                <Button label="Reset" icon="pi pi-filter-slash" severity="secondary" outlined size="small" @click="handleFilterReset" />
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
                    <span> {{ data.totalRemainingQty ?? '-' }} </span>
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
