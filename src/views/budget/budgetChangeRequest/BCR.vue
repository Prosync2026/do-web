<script src="./BCR.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div>
            <!-- Mobile Header Actions (Below Title) -->
            <div class="flex flex-row w-full mb-4 lg:hidden">
                <ProButton variant="primary" v-if="canCreateBCR" @click="$router.push('/bcr/create')" class="w-full justify-center px-2 text-sm">
                    <PhPlus class="mr-1 sm:mr-2" :size="16" weight="bold" /> New Change Request
                </ProButton>
            </div>

            <!-- Desktop Header Actions teleported to AppLayout -->
            <Teleport defer to="#page-header-actions">
                <div class="hidden lg:flex">
                    <ProButton variant="primary" v-if="canCreateBCR" @click="$router.push('/bcr/create')">
                        <PhPlus class="mr-2" :size="16" weight="bold" /> New Change Request
                    </ProButton>
                </div>
            </Teleport>

            <ProCard padding="lg" class="mb-0">
                <div class="grid grid-cols-12 gap-4 mt-4 mb-16">
                    <SummaryCard :cardItems="BudgetChangeRequestSummaryData" :cardCol="bcrSummaryCol" />
                </div>
                <div class="hidden lg:block">
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
                </div>

                <!-- Mobile View -->
                <div class="block lg:hidden mt-4">
                    <template v-if="budgetChangeRequestData.length > 0">
                        <div class="grid grid-cols-1 gap-4">
                            <ProCard v-for="row in budgetChangeRequestData" :key="row.Id" class="shadow-sm relative overflow-visible">
                                <div class="flex justify-between items-center mb-3">
                                    <ProTag :label="row.Status" :variant="getStatusSeverity(row.Status)" />
                                    <div class="flex items-center">
                                        <template v-if="row.actions && row.actions.includes('edit')">
                                            <ProMenu :width="160" placement="top-end">
                                                <template #trigger="{ isOpen }">
                                                    <button
                                                        class="inline-flex items-center justify-center w-8 h-8 rounded-button transition-all duration-150 cursor-pointer -mr-2"
                                                        :class="isOpen ? 'bg-surface-gray-bg-strong text-text-heading' : 'text-text-body hover:bg-surface-gray-bg hover:text-text-heading'"
                                                        aria-label="More actions"
                                                    >
                                                        <PhDotsThreeVertical :size="16" weight="bold" />
                                                    </button>
                                                </template>
                                                <template #items="{ close }">
                                                    <div class="py-1">
                                                        <button
                                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-body hover:bg-surface-gray-bg transition-colors duration-100"
                                                            @click.stop="close(); handleActionClick('view', row)"
                                                        >
                                                            <PhEye :size="15" class="shrink-0 text-text-subtitle" />
                                                            View
                                                        </button>
                                                        <button
                                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-body hover:bg-surface-gray-bg transition-colors duration-100"
                                                            @click.stop="close(); handleActionClick('edit', row)"
                                                        >
                                                            <PhPencil :size="15" class="shrink-0 text-text-subtitle" />
                                                            Edit
                                                        </button>
                                                    </div>
                                                </template>
                                            </ProMenu>
                                        </template>
                                        <template v-else>
                                            <ProButton variant="secondary" size="sm" @click="handleActionClick('view', row)" class="!px-2" title="View">
                                                <PhEye :size="16" />
                                            </ProButton>
                                        </template>
                                    </div>
                                </div>

                                <div class="flex items-start gap-2 mb-4">
                                    <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ row.rowIndex }}</span>
                                    <div class="flex flex-col gap-0.5">
                                        <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">BCR No</span>
                                        <span class="font-semibold text-text-heading leading-tight">{{ row.DocNo }}</span>
                                    </div>
                                </div>

                                <div class="grid gap-2 mb-4">
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-500 font-medium">Requested By</span>
                                        <span class="text-right">{{ row.RequestedBy }}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-500 font-medium">Date Requested</span>
                                        <span class="text-right">{{ formatDate(row.RequestDate) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm" v-if="canViewPricing">
                                        <span class="text-gray-500 font-medium">Variance Amount</span>
                                        <span class="text-right font-semibold">{{ row.TotalAmount }}</span>
                                    </div>
                                    
                                    <div class="flex flex-col gap-1 mt-2 border-t border-gray-100 pt-3" v-if="row.Remark">
                                        <span class="text-xs font-medium text-gray-500">Remark</span>
                                        <span class="text-sm text-gray-700 whitespace-pre-wrap">{{ row.Remark }}</span>
                                    </div>

                                    <div class="flex flex-col gap-1 mt-2 border-t border-gray-100 pt-3">
                                        <span class="text-xs font-medium text-gray-500">Approval Flow</span>
                                        <div class="flex flex-wrap gap-2 text-xs py-1">
                                            <template v-for="(step, index) in row.approvalFlow" :key="step.role">
                                                <div class="flex items-center gap-1.5" :title="step.status">
                                                    <span class="w-2 h-2 rounded-full" :class="step.status === 'approved' || step.status === 'acknowledged' ? 'bg-green-500' : step.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-400'"></span>
                                                    <span class="font-medium text-gray-700">{{ step.role }}</span>
                                                </div>
                                            </template>
                                        </div>
                                    </div>
                                </div>


                            </ProCard>
                        </div>
                        
                        <div class="mt-6 flex justify-center">
                            <ProPagination 
                                :modelValue="budgetCRStore.pagination.page" 
                                @update:modelValue="handleProTablePaginationUpdate({ page: $event, pageSize: budgetCRStore.pagination.pageSize })"
                                :totalPages="budgetCRStore.pagination.totalPages" 
                                :maxVisible="5" 
                            />
                        </div>
                    </template>
                    
                    <div v-else class="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                        <h3 class="text-lg font-medium text-gray-900">No Budget Change Requests</h3>
                        <p class="text-gray-500 mt-1">No records found.</p>
                    </div>
                </div>
            </ProCard>
        </div>
    </Motion>
</template>
