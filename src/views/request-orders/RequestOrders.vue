<script lang="ts" src="./RequestOrders.script.ts">
import { Button } from "@prosync/ui-kit";
</script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card mb-0">
            <BreadcrumbList />
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Request Orders</h1>
                    <p class="dark:text-gray-200 text-gray-500">Manage purchase requests for project materials and services</p>
                </div>
                <div class="flex gap-6">
                    <div class="relative inline-block">
                        <Button label="View Drafts" outlined @click="showDraftModal = true" class="pr-8"> </Button>
                        <Badge v-if="draftCount > 0" :value="draftCount" severity="danger" class="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <!-- <Button label="+ New Request Order" @click="$router.push('/request-orders/create')" /> -->
                    <Button v-if="canCreateRO" label="+ New Request Order" @click="$router.push('/request-orders/create')" />
                </div>
            </div>
            <ViewDraftRo :visible="showDraftModal" @update:visible="showDraftModal = $event" @update:count="draftCount = $event" />

            <RoSummary :pendingCount="pendingCount" :approvedCount="approvedCount" :totalValue="totalValue" />

            <!-- Tabs -->
            <div class="card">
                <BaseTab v-model="activeTab" :tabs="tabItems">
                    <template #default="{ activeTab }">
                        <Motion :key="activeTab" :initial="{ opacity: 0, x: 30 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -30 }" :transition="{ duration: 0.8 }">
                            <!-- Approval Legend -->
                            <div class="flex gap-6 mb-4 items-center text-sm py-2 px-4 border border-gray-200 dark:border-gray-600 rounded-md">
                                <div class="flex items-center gap-2">
                                    <span class="text-gray-700 dark:text-gray-200">Legend : </span>
                                </div>

                                <div class="flex items-center gap-2">
                                    <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
                                    <span class="text-gray-700 dark:text-gray-200">Pending</span>
                                </div>

                                <div class="flex items-center gap-2">
                                    <span class="w-3 h-3 rounded-full bg-green-500"></span>
                                    <span class="text-gray-700 dark:text-gray-200">Approved</span>
                                </div>

                                <div class="flex items-center gap-2">
                                    <span class="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span class="text-gray-700 dark:text-gray-200">Rejected</span>
                                </div>
                            </div>

                            <ReusableTable
                                :value="filteredOrders"
                                :columns="tableColumns"
                                :loading="store.loading"
                                :showCreate="false"
                                :showImportFile="false"
                                :onActionClick="handleActionClick"
                                :pagination="store.pagination"
                                :onPageChange="handlePageChange"
                                :onPageSizeChange="handlePageSizeChange"
                                :onSortChange="handleSortChange"
                                :sortField="currentSortField"
                                :sortOrder="currentSortOrder"
                                :onSearch="onSearchWrapper"
                                :extraFilters="tableFilters"
                                :onFilterChange="handleFilterChange"
                                emptyTitle="No request orders found"
                            >
                                <!-- Numbering Slot - Use rowIndex instead of index -->
                                <template #rowIndex="{ data }">
                                    {{ data.rowIndex }}
                                </template>

                                <!-- Status Badge Slot -->
                                <template #status="{ data }">
                                    <Badge :value="data.status" :severity="getStatusSeverity(data.status)" />
                                </template>

                                <!-- Budget Type Slot -->
                                <template #budgetType="{ data }">
                                    <span class="px-2 py-1 rounded text-xs" :class="data.budgetType === 'Budgeted' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">
                                        {{ data.budgetType }}
                                    </span>
                                </template>
                                <template #approvalStatus="{ data }">
                                    <div class="flex flex-col gap-1 text-xs py-2">
                                        <template v-for="(step, index) in data.approvalProgress" :key="step.level">
                                            <div class="flex items-center gap-2">
                                                <span class="w-3 h-3 rounded-full" :class="getApprovalDotClass(step.status)"></span>
                                                <span class="font-medium">
                                                    {{ step.level }}
                                                </span>
                                            </div>
                                            <!-- Connector line -->
                                            <div v-if="index < data.approvalProgress.length - 1" class="ml-[5px] h-3 border-l border-gray-300 dark:border-gray-600"></div>
                                        </template>
                                    </div>
                                </template>

                                <template #totalAmount="{ data }">
                                    <span class="font-semibold" :class="data.isHighValue ? 'text-orange-600' : ''"> RM {{ Number(data.totalAmount).toLocaleString() }} </span>

                                    <span v-if="data.isHighValue" class="ml-2 text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700">High Value</span>
                                </template>
                            </ReusableTable>
                        </Motion>
                    </template>
                </BaseTab>
            </div>

            <!-- View Modal -->
            <ViewRo v-model:visible="showDetailsModal" :order="selectedOrder" :isPurchasingRole="isPurchasingRole" @approve="handleApproveFromModal" @reject="handleRejectFromModal" />

            <!-- Edit Modal -->
            <EditRo :visible="showEditModal" :order="selectedOrder" @update:visible="showEditModal = $event" @save="handleSaveOrder" />

            <!-- reject RO Modal -->
            <RejectRo :visible="showRejectModal" :order-number="currentRejectOrder?.roNumber" @update:visible="showRejectModal = $event" @reject="onRejectConfirmed" />
        </div>
    </Motion>
</template>
