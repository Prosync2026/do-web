<script lang="ts" src="./PurchaseOrders.script"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-1">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6 p-3">
                <div>
                    <h1 class="text-h2 text-text-heading">Purchase Orders</h1>
                    <p class="text-body-sm text-text-subtitle">Manage and monitor purchase orders while keeping track of received items and discrepancies.</p>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-12 gap-4 mb-6 px-3">
                <!-- Pending POs -->
                <ProStatisticCard
                    class="col-span-12 md:col-span-3"
                    label="Pending POs"
                    :value="pendingList.length"
                    subtitle="No items delivered yet"
                    :icon="PhClock"
                    iconBg="bg-surface-info"
                />

                <!-- Partially Delivered -->
                <ProStatisticCard
                    class="col-span-12 md:col-span-3"
                    label="Partially Delivered"
                    :value="partiallyList.length"
                    subtitle="Some items delivered"
                    :icon="PhWarning"
                    iconBg="bg-surface-warn"
                />

                <!-- Completed -->
                <ProStatisticCard
                    class="col-span-12 md:col-span-3"
                    label="Completed"
                    :value="completedList.length"
                    subtitle="All items delivered"
                    :icon="PhCheckCircle"
                    iconBg="bg-surface-success"
                />

                <!-- Total POs -->
                <ProStatisticCard
                    class="col-span-12 md:col-span-3"
                    label="Total POs"
                    :value="pendingList.length + partiallyList.length + completedList.length"
                    subtitle="All purchase orders"
                    :icon="PhBookOpen"
                    iconBg="bg-surface-primary"
                />
            </div>

            <!-- Tabs -->
            <ProCard class="shadow-sm mt-6">
                <ProTabs v-model="activeTab" :tabs="tabItems" @update:modelValue="handleTabChange">
                    <Motion :key="activeTab" :initial="{ opacity: 0, x: 30 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -30 }" :transition="{ duration: 0.8 }">

                        <!-- =====================
                             PENDING
                        ====================== -->
                        <template v-if="activeTab === '0'">
                            <ProTable
                                :data="pendingList"
                                :columns="pendingListColumn"
                                :loading="isLoading"
                                :pagination="pagination"
                                emptyTitle="No Pending Purchase Orders Found"
                                @update:pagination="handleUpdatePagination"
                            >
                                <template #cell-totalAmount="{ row }">
                                    <span class="font-semibold text-text-heading">RM {{ Number(row.totalAmount).toLocaleString() }}</span>
                                </template>

                                <template #cell-status="{ row }">
                                    <ProTag
                                        :label="row.status === 'Created' ? 'Pending' : row.status"
                                        :variant="row.status === 'Completed' ? 'success' : row.status === 'Partially Delivered' ? 'warn' : 'info'"
                                    />
                                </template>

                                <template #actions="{ row }">
                                    <ProButton variant="secondary" size="sm" @click="viewPO(row)" title="View Purchase Order">
                                        <i class="pi pi-eye text-base text-gray-700"></i>
                                    </ProButton>
                                </template>
                            </ProTable>
                        </template>

                        <!-- =====================
                             PARTIAL DELIVERY
                        ====================== -->
                        <template v-else-if="activeTab === '1'">
                            <ProTable
                                :data="partiallyList"
                                :columns="partiallyListColumn"
                                :loading="isLoading"
                                :pagination="pagination"
                                emptyTitle="No Partially Delivered Purchase Orders Found"
                                @update:pagination="handleUpdatePagination"
                            >
                                <template #cell-status="{ row }">
                                    <ProTag label="Partially Delivered" variant="warn" />
                                </template>
                            </ProTable>
                        </template>

                        <!-- =====================
                             COMPLETED
                        ====================== -->
                        <template v-else-if="activeTab === '2'">
                            <ProTable
                                :data="completedList"
                                :columns="completedListColumn"
                                :loading="isLoading"
                                :pagination="pagination"
                                emptyTitle="No Completed Purchase Orders Found"
                                @update:pagination="handleUpdatePagination"
                            >
                                <template #cell-discrepancyType="{ row }">
                                    <ProTag
                                        :label="row.discrepancyType"
                                        :variant="row.discrepancyType === 'Partial Delivery' ? 'warn' : 'error'"
                                    />
                                </template>

                                <template #cell-status="{ row }">
                                    <ProTag label="Completed" variant="success" />
                                </template>
                            </ProTable>
                        </template>

                    </Motion>
                </ProTabs>
            </ProCard>
        </div>
    </Motion>
</template>
