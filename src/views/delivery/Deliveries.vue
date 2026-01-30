<script lang="ts" src="./Delivery.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card mb-0">
            <div class="flex justify-between items-center mb-4">
                <h1 class="text-2xl font-bold">Delivery Verification</h1>
                <Button @click="$router.push('/deliveries/createDelivery')"> + New Delivery Verification </Button>
            </div>

            <BaseTab v-model="activeTab" :tabs="tabItems" @update:modelValue="handleTabChange">
                <template #default="{ activeTab }">
                    <!-- Pending Deliveries -->
                    <template v-if="activeTab === '0'">
                        <ReusableTable
                            :value="filteredDeliveries"
                            :columns="deliveryListColumn"
                            :loading="deliveryStore.loading"
                            :pagination="deliveryStore.pagination"
                            :sortField="currentSortField"
                            :sortOrder="currentSortOrder"
                            :onPageChange="handlePageChange"
                            :onPageSizeChange="handlePageSizeChange"
                            :onFilterChange="handleFilterChange"
                            :onSearch="handleSearch"
                            :onSortChange="handleSortChange"
                            :onActionClick="handleAction"
                            emptyTitle="No pending deliveries found"
                        >
                            <!-- Numbering -->
                            <template #rowIndex="{ data }">
                                {{ data.rowIndex }}
                            </template>

                            <!-- Status -->
                            <template #status="{ data }">
                                <Tag :value="data.Status" severity="warn" />
                            </template>
                        </ReusableTable>
                    </template>

                    <!-- Completed Deliveries -->
                    <template v-else>
                        <ReusableTable
                            :value="filteredDeliveries"
                            :columns="deliveryListColumn"
                            :loading="deliveryStore.loading"
                            :pagination="deliveryStore.pagination"
                            :sortField="currentSortField"
                            :sortOrder="currentSortOrder"
                            :onPageChange="handlePageChange"
                            :onPageSizeChange="handlePageSizeChange"
                            :onFilterChange="handleFilterChange"
                            :onSearch="handleSearch"
                            :onSortChange="handleSortChange"
                            :onActionClick="handleAction"
                            emptyTitle="No completed deliveries found"
                        >
                            <!-- Numbering -->
                            <template #rowIndex="{ data }">
                                {{ data.rowIndex }}
                            </template>

                            <!-- Status -->
                            <template #status="{ data }">
                                <Tag :value="data.Status" severity="success" />
                            </template>
                        </ReusableTable>
                    </template>
                </template>
            </BaseTab>
        </div>
    </Motion>
</template>
