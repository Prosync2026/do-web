<script src="./BCR.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div>
            <Teleport to="#page-header-actions">
                <ProButton variant="primary" v-if="canCreateBCR" @click="$router.push('/bcr/create')"> + New Change Request </ProButton>
            </Teleport>

            <ProCard padding="lg" class="mb-0">
                <div class="grid grid-cols-12 gap-4 mt-4 mb-16">
                    <SummaryCard :cardItems="BudgetChangeRequestSummaryData" :cardCol="bcrSummaryCol" />
                </div>

                <!-- Toolbar: Search + Filters + Page Size -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600">Rows per page:</span>
                        <ProSelect :modelValue="budgetCRStore.pagination.pageSize" @update:modelValue="handlePageSizeChange" :options="pageSizeOptions" class="w-24 text-sm" />
                    </div>
                    <div class="flex gap-2 items-center flex-wrap">
                        <ProSelect :modelValue="bcrStatusFilter" @update:modelValue="handleBcrStatusFilterChange" :options="statusFilterOptions" class="min-w-[180px] text-sm" />
                        <ProInput v-model="bcrSearchTerm" placeholder="Search..." class="w-64" @keyup.enter="handleBcrSearch" />
                    </div>
                </div>

                <ProTable
                    :columns="proTableColumns"
                    :data="budgetChangeRequestData"
                    :loading="budgetCRStore.loading"
                    :pagination="{ page: budgetCRStore.pagination.page, pageSize: budgetCRStore.pagination.pageSize, total: budgetCRStore.pagination.total }"
                    :showRowIndex="true"
                    emptyTitle="No Budget Change Requests"
                    emptyDescription="No records found."
                    @sort="handleProTableSort"
                    @update:pagination="handleProTablePaginationUpdate"
                >
                    <template #cell-RequestDate="{ row }">
                        {{ formatDate(row.RequestDate) }}
                    </template>

                    <template #cell-TotalAmount="{ row }">
                        <span class="font-semibold">{{ row.TotalAmount }}</span>
                    </template>

                    <template #cell-approvalFlow="{ row }">
                        <div class="flex items-center gap-2 flex-wrap">
                            <template v-for="(step, index) in row.approvalFlow" :key="step.role">
                                <ProTag :label="step.role" :variant="statusSeverity[step.status] || 'secondary'" />
                                <i v-if="index < row.approvalFlow.length - 1" class="pi pi-angle-right text-gray-400" />
                            </template>
                        </div>
                    </template>

                    <template #actions="{ row }">
                        <div class="flex gap-1">
                            <ProButton variant="ghost" size="sm" @click="handleActionClick('view', row)">
                                <i class="pi pi-eye"></i>
                            </ProButton>
                            <ProButton v-if="row.actions && row.actions.includes('edit')" variant="ghost" size="sm" @click="handleActionClick('edit', row)">
                                <i class="pi pi-pencil"></i>
                            </ProButton>
                        </div>
                    </template>
                </ProTable>
            </ProCard>
        </div>
    </Motion>
</template>
