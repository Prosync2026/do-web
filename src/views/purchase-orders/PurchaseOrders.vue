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
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 px-3">
                <!-- Pending POs -->
                <ProCard class="shadow-sm border-0 border-l-4 border-yellow-500">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold text-text-heading">Pending POs</h3>
                            <p class="text-3xl font-bold text-yellow-600 mt-2">{{ pendingList.length }}</p>
                            <p class="text-text-subtitle text-sm mt-1">No items delivered yet</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
                            <PhClock :size="24" class="text-yellow-600" />
                        </div>
                    </div>
                </ProCard>

                <!-- Partially Delivered -->
                <ProCard class="shadow-sm border-0 border-l-4 border-orange-500">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold text-text-heading">Partially Delivered</h3>
                            <p class="text-3xl font-bold text-orange-500 mt-2">{{ partiallyList.length }}</p>
                            <p class="text-text-subtitle text-sm mt-1">Some items delivered</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                            <PhWarning :size="24" class="text-orange-500" />
                        </div>
                    </div>
                </ProCard>

                <!-- Completed -->
                <ProCard class="shadow-sm border-0 border-l-4 border-green-500">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold text-text-heading">Completed</h3>
                            <p class="text-3xl font-bold text-green-600 mt-2">{{ completedList.length }}</p>
                            <p class="text-text-subtitle text-sm mt-1">All items delivered</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                            <PhCheckCircle :size="24" class="text-green-600" />
                        </div>
                    </div>
                </ProCard>

                <!-- Total POs -->
                <ProCard class="shadow-sm border-0 border-l-4 border-brand-primary">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold text-text-heading">Total POs</h3>
                            <p class="text-3xl font-bold text-brand-primary mt-2">{{ pendingList.length + partiallyList.length + completedList.length }}</p>
                            <p class="text-text-subtitle text-sm mt-1">All purchase orders</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                            <PhBookOpen :size="24" class="text-brand-primary" />
                        </div>
                    </div>
                </ProCard>
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
