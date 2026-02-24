<script lang="ts" src="./PurchaseOrders.script"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card mb-0">
            <BreadcrumbList />

            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Purchase Orders</h1>
                    <p class="text-gray-500">Manage and monitor purchase orders while keeping track of received items and discrepancies.</p>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4 mb-3">
                <POSummaryData :cardItems="poSummaryData" :cardCol="4" />
            </div>

            <!-- Tabs -->
            <div class="card mt-6">
                <BaseTab v-model="activeTab" :tabs="tabItems" @update:modelValue="handleTabChange">
                    <template #default="{ activeTab }">
                        <Motion :key="activeTab" :initial="{ opacity: 0, x: 30 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -30 }" :transition="{ duration: 0.8 }">
                            <!-- =====================
                                 PENDING
                            ====================== -->
                            <template v-if="activeTab === '0'">
                                <ReusableTable
                                    :value="pendingList"
                                    :columns="pendingListColumn"
                                    :loading="isLoading"
                                    :pagination="pagination"
                                    :sortField="currentSortField"
                                    :sortOrder="currentSortOrder"
                                    :onSearch="onSearchWrapper"
                                    :onSortChange="handleSortChange"
                                    emptyTitle="No Pending Purchase Orders Found"
                                >
                                    <template #no="{ data }">
                                        {{ data.no }}
                                    </template>

                                    <template #totalAmount="{ data }">
                                        <span class="font-semibold"> RM {{ Number(data.totalAmount).toLocaleString() }} </span>
                                    </template>

                                    <template #status="{ data }">
                                        <Tag :value="data.status === 'Created' ? 'Pending' : data.status" :severity="data.status === 'Completed' ? 'success' : data.status === 'Partially Delivered' ? 'warning' : 'info'" />
                                    </template>

                                    <template #action="{ data }">
                                        <Button icon="pi pi-eye" class="p-button-text p-button-sm" @click="viewPO(data)" v-tooltip="'View Purchase Order'" />
                                    </template>
                                </ReusableTable>
                            </template>

                            <!-- =====================
                                 PARTIAL DELIVERY
                            ====================== -->
                            <template v-else-if="activeTab === '1'">
                                <ReusableTable
                                    :value="partiallyList"
                                    :columns="partiallyListColumn"
                                    :loading="isLoading"
                                    :onSearch="onSearchWrapper"
                                    :onSortChange="handleSortChange"
                                    :sortField="currentSortField"
                                    :sortOrder="currentSortOrder"
                                    emptyTitle="No Partially Delivered Purchase Orders Found"
                                >
                                    <template #no="{ data }">
                                        {{ data.no }}
                                    </template>

                                    <template #status="{ data }">
                                        <Tag value="Partially Delivered" severity="warning" />
                                    </template>
                                </ReusableTable>
                            </template>

                            <!-- =====================
                                 COMPLETED
                            ====================== -->
                            <template v-else-if="activeTab === '2'">
                                <ReusableTable
                                    :value="completedList"
                                    :columns="completedListColumn"
                                    :loading="isLoading"
                                    :onSearch="onSearchWrapper"
                                    :onSortChange="handleSortChange"
                                    :sortField="currentSortField"
                                    :sortOrder="currentSortOrder"
                                    emptyTitle="No Completed Purchase Orders Found"
                                >
                                    <template #no="{ data }">
                                        {{ data.no }}
                                    </template>

                                    <template #discrepancyType="{ data }">
                                        <Tag :value="data.discrepancyType" :severity="data.discrepancyType === 'Partial Delivery' ? 'warning' : 'danger'" />
                                    </template>

                                    <template #status="{ data }">
                                        <Tag value="Completed" severity="success" />
                                    </template>
                                </ReusableTable>
                            </template>
                        </Motion>
                    </template>
                </BaseTab>
            </div>
        </div>
    </Motion>
</template>
