<script src="./BudgetList.script.ts"></script>

<template>
    <div>
        <ReusableTable
            :value="filteredItems"
            :columns="columns"
            emptyTitle="Budget List Data"
            :pagination="pagination"
            :onPageChange="handlePageChange"
            :onPageSizeChange="handlePageSizeChange"
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
