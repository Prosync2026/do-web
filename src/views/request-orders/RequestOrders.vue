<script lang="ts" src="./RequestOrders.script.ts">
import { Button } from "@prosync/ui-kit";
</script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-1">
            <!-- Header Actions teleported to AppLayout -->
            <div class="flex gap-4 items-center justify-end w-full p-3">
                <div class="relative">
                    <ProButton variant="secondary" @click="showDraftModal = true">
                        View Drafts
                    </ProButton>
                    <Badge v-if="draftCount > 0" :value="draftCount" severity="danger" class="absolute shadow-sm" style="top: -8px; right: -10px; transform: scale(0.85);" />
                </div>
                <ProButton v-if="canCreateRO" variant="primary" @click="$router.push('/request-orders/create')">
                    <i class="pi pi-plus mr-2"></i> New Request Order
                </ProButton>
            </div>
            <teleport to="body">
                <ViewDraftRo :visible="showDraftModal" @update:visible="showDraftModal = $event" @update:count="draftCount = $event" />
            </teleport>

            <RoSummary :submittedCount="submittedCount" :approvedCount="approvedCount" :totalApprovedValue="totalApprovedValue" :totalValue="totalValue" />

            <!-- Tabs and Table Wrap in Card -->
            <ProCard class="shadow-sm">
                <ProTabs v-model="activeTab" :tabs="tabItems">
                        <Motion :key="activeTab" :initial="{ opacity: 0, x: 30 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -30 }" :transition="{ duration: 0.8 }">
                            
                            <div class="flex justify-end mb-4">
                                <!-- Legend -->
                                <div class="flex justify-end gap-3 items-center text-xs py-1.5 px-3 border border-border-border rounded-md bg-surface-gray-bg">
                                    <span class="text-text-subtitle font-medium">Legend :</span>
                                    <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span><span class="text-text-body">Pending</span></div>
                                    <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span><span class="text-text-body">Approved</span></div>
                                    <div class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span><span class="text-text-body">Rejected</span></div>
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm text-gray-600">Rows per page:</span>
                                    <ProSelect :modelValue="store.pagination.pageSize" @update:modelValue="handlePageSizeChange" :options="[{label:'10', value:10}, {label:'25', value:25}, {label:'50', value:50}, {label:'100', value:100}]" class="w-24 text-sm" />
                                </div>
                                <div class="flex gap-2 items-center flex-wrap justify-end">
                                    <div class="flex items-center gap-2">
                                        <div class="w-36">
                                            <ProDatePicker v-model="startDate" placeholder="Start Date" appendTo="body" @update:modelValue="applyFilters" />
                                        </div>
                                        <span class="text-text-subtitle">-</span>
                                        <div class="w-36">
                                            <ProDatePicker v-model="endDate" placeholder="End Date" appendTo="body" @update:modelValue="applyFilters" />
                                        </div>
                                    </div>
                                    <div class="w-48" v-if="isPurchasingRole">
                                        <ProSelect v-model="store.filters.projectId" :options="[{ label: 'All Projects', value: '' }, ...projectStore.projectOptions]" placeholder="All Projects" @update:modelValue="applyFilters" />
                                    </div>
                                    <div class="w-48">
                                        <ProSelect v-model="selectedBudgetType" :options="[{ label: 'All Budgets', value: '' }, { label: 'Budgeted', value: 'Budgeted' }, { label: 'NonBudgeted', value: 'NonBudgeted' }]" placeholder="All Budgets" @update:modelValue="applyFilters" />
                                    </div>
                                    <ProInput :modelValue="store.filters.search" placeholder="Search orders..." class="w-64" @update:modelValue="store.handleSearch" />
                                </div>
                            </div>

                            <ProTable
                                @search="store.handleSearch"
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

                                <template #cell-approvalProgress="{ row }">
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

                                <template #actions="{ row }">
                                    <div class="flex items-center gap-1">
                                        <!-- If only 1 action is available, show it directly -->
                                        <template v-if="getAvailableActions(row).length === 1">
                                            <ProIconButton :tooltip="getAvailableActions(row)[0].label" :variant="getAvailableActions(row)[0].variant" @click.stop="getAvailableActions(row)[0].onClick">
                                                <component :is="getAvailableActions(row)[0].icon" :size="18" :class="getAvailableActions(row)[0].iconClass" />
                                            </ProIconButton>
                                        </template>

                                        <!-- If more than 1 action is available, show the overflow menu -->
                                        <template v-else-if="getAvailableActions(row).length > 1">
                                            <ProMenu align="right" width="w-48">
                                                <template #trigger="{ isOpen }">
                                                    <button
                                                        class="inline-flex items-center justify-center w-8 h-8 rounded-button transition-all duration-150 cursor-pointer"
                                                        :class="isOpen ? 'bg-surface-gray-bg-strong text-text-heading' : 'text-text-body hover:bg-surface-gray-bg hover:text-text-heading'"
                                                        aria-label="More actions"
                                                    >
                                                        <PhDotsThreeVertical :size="16" weight="bold" />
                                                    </button>
                                                </template>
                                                <template #items="{ close }">
                                                    <div class="py-1">
                                                        <button
                                                            v-for="action in getAvailableActions(row).filter((a: any) => a.tier !== 'destructive')"
                                                            :key="action.label"
                                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-body hover:bg-surface-gray-bg transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            @click.stop="
                                                                close();
                                                                action.onClick?.();
                                                            "
                                                        >
                                                            <component :is="action.icon" :size="15" class="shrink-0 text-text-subtitle" :class="action.iconClass" />
                                                            {{ action.label }}
                                                        </button>
                                                        <div v-if="getAvailableActions(row).some((a: any) => a.tier === 'destructive') && getAvailableActions(row).some((a: any) => a.tier !== 'destructive')" class="my-1 border-t border-border-border" />
                                                        <button
                                                            v-for="action in getAvailableActions(row).filter((a: any) => a.tier === 'destructive')"
                                                            :key="action.label"
                                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm hover:bg-surface-error/20 transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            :class="action.iconClass || 'text-text-error'"
                                                            @click.stop="
                                                                close();
                                                                action.onClick?.();
                                                            "
                                                        >
                                                            <component :is="action.icon" :size="15" class="shrink-0" />
                                                            {{ action.label }}
                                                        </button>
                                                    </div>
                                                </template>
                                            </ProMenu>
                                        </template>
                                    </div>
                                </template>
                            </ProTable>
                        </Motion>
                </ProTabs>
            </ProCard>

            <teleport to="body">
                <ViewRo v-model:visible="showDetailsModal" :order="selectedOrder" :isPurchasingRole="isPurchasingRole" @approve="handleApproveFromModal" @reject="handleRejectFromModal" />
                <EditRo :visible="showEditModal" :order="selectedOrder" @update:visible="showEditModal = $event" @save="handleSaveOrder" />
                <RejectRo :visible="showRejectModal" :order-number="currentRejectOrder?.roNumber" @update:visible="showRejectModal = $event" @reject="onRejectConfirmed" />
                <ApproveRo :visible="showApproveModal" :order-number="currentApproveOrder?.roNumber" @update:visible="showApproveModal = $event" @approve="onApproveConfirmed" />
            </teleport>
        </div>
    </Motion>
</template>
