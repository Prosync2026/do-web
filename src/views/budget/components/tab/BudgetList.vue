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
            <template #rate="{ data }"> RM {{ formatCurrency(data.rate) }} </template>
            <template #amount="{ data }"> RM {{ formatCurrency(data.amount) }} </template>
        </ReusableTable>
    </div>
</template>
