<script lang="ts" src="./RequestOrders.script.ts">
import { Button } from "@prosync/ui-kit";
</script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-1">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <ProPageHeader title="Request Orders" subtitle="Manage purchase requests for project materials and services" />
                <div class="flex gap-4 items-center">
                    <ProButton variant="secondary" @click="showDraftModal = true">
                        View Drafts
                        <Badge v-if="draftCount > 0" :value="draftCount" severity="danger" class="ml-2" />
                    </ProButton>
                    <ProButton v-if="canCreateRO" variant="primary" @click="$router.push('/request-orders/create')">
                        <i class="pi pi-plus mr-2"></i> New Request Order
                    </ProButton>
                </div>
            </div>
            
            <ViewDraftRo :visible="showDraftModal" @update:visible="showDraftModal = $event" @update:count="draftCount = $event" />

            <RoSummary :submittedCount="submittedCount" :approvedCount="approvedCount" :totalApprovedValue="totalApprovedValue" :totalValue="totalValue" />

            <!-- Tabs and Table Wrap in Card -->
            <ProCard class="shadow-sm">
                <ProTabs v-model="activeTab" :tabs="tabItems">
                        <Motion :key="activeTab" :initial="{ opacity: 0, x: 30 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -30 }" :transition="{ duration: 0.8 }">
                            
                            <!-- Filters Bar -->
                            <div class="flex flex-wrap items-center justify-between gap-4 py-4">
                                <div class="flex flex-wrap items-center gap-3">
                                    <div class="w-64">
                                        <ProInput v-model="store.filters.search" placeholder="Search orders..." icon="pi pi-search" @update:modelValue="applyFilters" />
                                    </div>
                                    <div class="w-48" v-if="isPurchasingRole">
                                        <select v-model="store.filters.projectId" class="w-full appearance-none bg-surface-gray-bg border border-border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary" @change="applyFilters">
                                            <option value="">All Projects</option>
                                            <option v-for="opt in projectStore.projectOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                                        </select>
                                    </div>
                                    <div class="w-48">
                                        <select v-model="selectedBudgetType" class="w-full appearance-none bg-surface-gray-bg border border-border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary" @change="applyFilters">
                                            <option value="">All Budgets</option>
                                            <option value="Budgeted">Budgeted</option>
                                            <option value="NonBudgeted">NonBudgeted</option>
                                        </select>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <input type="date" v-model="startDate" @change="applyFilters" class="appearance-none bg-surface-gray-bg border border-border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary cursor-pointer w-36 text-text-body" title="Start Date" />
                                        <span class="text-text-subtitle">-</span>
                                        <input type="date" v-model="endDate" @change="applyFilters" class="appearance-none bg-surface-gray-bg border border-border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary cursor-pointer w-36 text-text-body" title="End Date" />
                                    </div>
                                </div>
                                <!-- Legend -->
                                <div class="flex justify-end gap-5 items-center text-xs py-2 px-3 border border-border-border rounded-md bg-surface-gray-bg">
                                    <span class="text-text-subtitle font-medium">Legend :</span>
                                    <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span><span class="text-text-body">Pending</span></div>
                                    <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span><span class="text-text-body">Approved</span></div>
                                    <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span><span class="text-text-body">Rejected</span></div>
                                </div>
                            </div>

                            <ProTable
                                :data="filteredOrders"
                                :columns="tableColumns"
                                :loading="store.loading"
                                emptyTitle="No request orders found"
                                :pagination="store.pagination"
                                @update:pagination="handleUpdatePagination"
                            >
                                <template #cell-status="{ row }">
                                    <ProTag :label="row.status" :variant="row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'error' : row.status === 'Processing' ? 'warn' : 'info'" />
                                </template>

                                <template #cell-budgetType="{ row }">
                                    <div class="flex items-center gap-2">
                                        <ProTag :label="row.budgetType" :variant="row.budgetType === 'Budgeted' ? 'success' : 'warn'" />
                                        <i v-if="row.isBudgetExceeded" class="pi pi-exclamation-triangle text-red-500 text-sm" v-tooltip.top="'Budget exceeded - PD approval required'" />
                                    </div>
                                </template>

                                <template #cell-approvalStatus="{ row }">
                                    <div class="flex flex-col gap-1 text-xs py-2">
                                        <template v-for="(step, index) in row.approvalProgress" :key="step.level">
                                            <div class="flex items-center gap-2">
                                                <span class="w-2.5 h-2.5 rounded-full" :class="getApprovalDotClass(step.status)"></span>
                                                <span class="font-medium text-text-body">{{ step.level }}</span>
                                            </div>
                                            <div v-if="index < row.approvalProgress.length - 1" class="ml-[4px] h-2.5 border-l border-border-border"></div>
                                        </template>
                                    </div>
                                </template>

                                <template #cell-totalAmount="{ row }">
                                    <span class="font-semibold text-text-heading"> RM {{ formatCurrency(row.totalAmount) }} </span>
                                </template>

                                <template #cell-actions="{ row }">
                                    <div class="flex items-center gap-2 relative z-50">
                                        <ProButton v-if="canViewRO" variant="secondary" size="sm" @click="handleActionClick('view', row)">
                                            <i class="pi pi-eye"></i>
                                        </ProButton>
                                        
                                        <ProButton v-if="canEditRO && isPurchasingRole && row.currentApprovalStage === 'PURCH'" variant="secondary" size="sm" @click="handleActionClick('edit', row)">
                                            <i class="pi pi-pencil"></i>
                                        </ProButton>

                                        <template v-if="canApproveRow(row)">
                                            <ProButton variant="success" size="sm" @click="handleActionClick('approve', row)">
                                                <i class="pi pi-check text-white"></i>
                                            </ProButton>
                                            <ProButton variant="danger" size="sm" @click="handleActionClick('reject', row)">
                                                <i class="pi pi-times"></i>
                                            </ProButton>
                                        </template>

                                        <ProButton v-if="canDeleteRO" variant="danger" size="sm" @click="handleActionClick('delete', row)">
                                            <i class="pi pi-trash"></i>
                                        </ProButton>
                                    </div>
                                </template>
                            </ProTable>
                        </Motion>
                </ProTabs>
            </ProCard>

            <ViewRo v-model:visible="showDetailsModal" :order="selectedOrder" :isPurchasingRole="isPurchasingRole" @approve="handleApproveFromModal" @reject="handleRejectFromModal" />
            <EditRo :visible="showEditModal" :order="selectedOrder" @update:visible="showEditModal = $event" @save="handleSaveOrder" />
            <RejectRo :visible="showRejectModal" :order-number="currentRejectOrder?.roNumber" @update:visible="showRejectModal = $event" @reject="onRejectConfirmed" />
        </div>
    </Motion>
</template>
