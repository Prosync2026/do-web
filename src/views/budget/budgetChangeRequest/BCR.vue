<script src="./BCR.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div>
            <Teleport defer to="#page-header-actions">
                <ProButton variant="primary" v-if="canCreateBCR" @click="$router.push('/bcr/create')">
                    <PhPlus class="mr-2" :size="16" weight="bold" /> New Change Request
                </ProButton>
            </Teleport>

            <ProCard padding="lg" class="mb-0">
                <div class="grid grid-cols-12 gap-4 mt-4 mb-16">
                    <SummaryCard :cardItems="BudgetChangeRequestSummaryData" :cardCol="bcrSummaryCol" />
                </div>




                <ProTable
                    :columns="proTableColumns"
                    :data="budgetChangeRequestData"
                    :loading="budgetCRStore.loading"
                    :pagination="{ page: budgetCRStore.pagination.page, pageSize: budgetCRStore.pagination.pageSize, total: budgetCRStore.pagination.total }"
                    :showRowIndex="true"
                    searchable
                    searchPlaceholder="Search..."
                    @search="(q) => { bcrSearchTerm = q; handleBcrSearch() }"
                    emptyTitle="No Budget Change Requests"
                    emptyDescription="No records found."
                    @sort="handleProTableSort"
                    @update:pagination="handleProTablePaginationUpdate"
                >
                    <template #toolbar>
                        <ProSelect :modelValue="bcrStatusFilter" @update:modelValue="handleBcrStatusFilterChange" :options="statusFilterOptions" placeholder="All Status" class="w-48" />
                        
                        <div class="flex items-center gap-2 ml-2 border-l border-gray-200 pl-4 h-8 shrink-0">
                            <span class="text-sm text-gray-600">Rows per page:</span>
                            <ProSelect :modelValue="budgetCRStore.pagination.pageSize" @update:modelValue="handlePageSizeChange" :options="pageSizeOptions" class="w-24 shrink-0" />
                        </div>
                    </template>

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
                                <PhCaretRight v-if="index < row.approvalFlow.length - 1" :size="16" weight="bold" class="text-gray-400" />
                            </template>
                        </div>
                    </template>

                    <template #actions="{ row }">
                        <div class="flex gap-1">
                            <ProButton variant="ghost" size="sm" @click="handleActionClick('view', row)">
                                <PhEye :size="18" />
                            </ProButton>
                            <ProButton v-if="row.actions && row.actions.includes('edit')" variant="ghost" size="sm" @click="handleActionClick('edit', row)">
                                <PhPencil :size="18" />
                            </ProButton>
                        </div>
                    </template>
                </ProTable>
            </ProCard>
        </div>
    </Motion>
</template>
