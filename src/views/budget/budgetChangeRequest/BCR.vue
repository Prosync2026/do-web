<script src="./BCR.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card mb-0">
            <BreadcrumbList />

            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Budget Change Request</h1>
                    <p class="dark:text-gray-200 text-gray-500">Manage budget change requests and track approval status</p>
                </div>
                <Button label="+ New Change Request" v-if="canCreateBCR" @click="$router.push('/bcr/create')" />
            </div>

            <div class="grid grid-cols-12 gap-4 mt-4 mb-16">
                <SummaryCard :cardItems="BudgetChangeRequestSummaryData" :cardCol="bcrSummaryCol" />
            </div>

            <ReusableTable
                :value="budgetChangeRequestData"
                :columns="tableColumns"
                :loading="budgetCRStore.loading"
                :pagination="budgetCRStore.pagination"
                :onPageChange="handlePageChange"
                :onPageSizeChange="handlePageSizeChange"
                :onSearch="handleSearch"
                :extraFilters="extraFilters"
                :onFilterChange="handleFilterChange"
                :onActionClick="handleActionClick"
                :onSortChange="handleSortChange"
                :sortField="currentSortField"
                :sortOrder="currentSortOrder"
            >
                <template #status="{ data }">
                    <Badge :value="data.Status" :severity="getStatusSeverity(data.Status)" />
                </template>

                <template #TotalAmount="{ data }">
                    <span class="font-semibold">{{ data.TotalAmount }}</span>
                </template>
                <!-- approval flow  -->
                <template #approvalFlow="{ data }">
                    <div class="flex items-center gap-2 flex-wrap">
                        <template v-for="(step, index) in data.approvalFlow" :key="step.role">
                            <Badge :value="step.role" :severity="step.status === 'approved' ? 'success' : step.status === 'pending' ? 'warn' : 'secondary'" />

                            <i v-if="index < data.approvalFlow.length - 1" class="pi pi-angle-right text-gray-400" />
                        </template>
                    </div>
                </template>
            </ReusableTable>
        </div>
    </Motion>
</template>
