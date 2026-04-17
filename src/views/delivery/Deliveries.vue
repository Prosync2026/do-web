<script lang="ts" src="./Delivery.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-1">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6 p-3">
                <div>
                    <h1 class="text-h2 text-text-heading">Delivery Verification</h1>
                </div>
                <ProButton @click="$router.push('/deliveries/createDelivery')">
                    <i class="pi pi-plus mr-2" /> New Delivery Verification
                </ProButton>
            </div>

            <!-- Tabs and Table -->
            <ProCard class="shadow-sm mt-6">
                <ProTabs v-model="activeTab" :tabs="tabItems" @update:modelValue="handleTabChange">
                    <Motion :key="activeTab" :initial="{ opacity: 0, x: 30 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -30 }" :transition="{ duration: 0.8 }">
                        <ProTable
                            searchable
                            searchPlaceholder="Search deliveries..."
                            @search="handleSearch"
                            :data="filteredDeliveries"
                            :columns="deliveryListColumn"
                            :loading="deliveryStore.loading"
                            :pagination="deliveryStore.pagination"
                            emptyTitle="No delivery orders found"
                            @update:pagination="handleUpdatePagination"
                        >
                            <template #toolbar>
                                <div class="flex flex-wrap items-center gap-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-36">
                                            <ProDatePicker v-model="startDate" placeholder="Start Date" appendTo="body" @update:modelValue="handleSearch('')" />
                                        </div>
                                        <span class="text-text-subtitle">-</span>
                                        <div class="w-36">
                                            <ProDatePicker v-model="endDate" placeholder="End Date" appendTo="body" @update:modelValue="handleSearch('')" />
                                        </div>
                                    </div>
                                    <div class="w-48" v-if="isPurchasingRole">
                                        <ProSelect v-model="deliveryStore.filters.projectId" :options="[{ label: 'All Projects', value: '' }, ...projectStore.projectOptions]" placeholder="All Projects" @update:modelValue="handleSearch('')" />
                                    </div>
                                </div>
                            </template>

                            <template #cell-rowIndex="{ row }">
                                <span>{{ row.rowIndex }}</span>
                            </template>

                            <template #cell-status="{ row }">
                                <ProTag 
                                    :label="row.Status === 'Created' ? 'Pending' : row.Status" 
                                    :variant="getStatusSeverity(row.Status)" 
                                />
                            </template>

                            <template #actions="{ row }">
                                <ProButton variant="secondary" size="sm" @click="handleAction('view', row)" title="View Delivery">
                                    <i class="pi pi-eye text-base text-gray-700"></i>
                                </ProButton>
                            </template>
                        </ProTable>
                    </Motion>
                </ProTabs>
            </ProCard>
        </div>
    </Motion>
</template>
