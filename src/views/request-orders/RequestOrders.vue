<script lang="ts" src="./RequestOrders.script.ts"></script>

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
                            <ReusableTable
                                :value="filteredOrders"
                                :columns="tableColumns"
                                :loading="store.loading"
                                :showCreate="false"
                                :showImportFile="false"
                                :onActionClick="handleActionClick"
                                :onSearch="onSearchWrapper"
                                :pagination="store.pagination"
                                :onPageChange="handlePageChange"
                                :onPageSizeChange="handlePageSizeChange"
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

                                <!-- Total Amount Slot -->
                                <template #totalAmount="{ data }">
                                    <span class="font-semibold">RM {{ Number(data.totalAmount).toLocaleString() }}</span>
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
        </div>
    </Motion>
</template>
