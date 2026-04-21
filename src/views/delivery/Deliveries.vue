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
                
                <!-- Mobile Tab Scroll Indicator -->
                <div class="flex items-center text-xs text-gray-400 mb-2 lg:hidden w-full justify-end">
                    <span class="italic mr-1">Swipe tabs</span>
                    <PhArrowsLeftRight :size="14" class="animate-pulse" />
                </div>

                <ProTabs v-model="activeTab" :tabs="tabItems" @update:modelValue="handleTabChange" class="pro-tabs-scrollable">
                    <Motion :key="activeTab" :initial="{ opacity: 0, x: 30 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -30 }" :transition="{ duration: 0.8 }">

                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-gray-600">Rows per page:</span>
                                <ProSelect :modelValue="deliveryStore.pagination.pageSize" @update:modelValue="handleUpdatePagination({ page: 1, pageSize: $event })" :options="[{label:'10', value:10}, {label:'25', value:25}, {label:'50', value:50}, {label:'100', value:100}]" class="w-24 text-sm" />
                            </div>
                            <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-wrap sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                                <div class="flex items-center gap-2 w-full sm:w-auto">
                                    <div class="flex-1 sm:w-36">
                                        <ProDatePicker v-model="startDate" placeholder="Start Date" appendTo="body" @update:modelValue="handleSearch('')" />
                                    </div>
                                    <span class="text-text-subtitle">-</span>
                                    <div class="flex-1 sm:w-36">
                                        <ProDatePicker v-model="endDate" placeholder="End Date" appendTo="body" @update:modelValue="handleSearch('')" />
                                    </div>
                                </div>
                                <div class="w-full sm:w-48" v-if="isPurchasingRole">
                                    <ProSelect v-model="deliveryStore.filters.projectId" :options="[{ label: 'All Projects', value: '' }, ...projectStore.projectOptions]" placeholder="All Projects" @update:modelValue="handleSearch('')" />
                                </div>
                                <ProInput :modelValue="deliveryStore.filters.search" placeholder="Search deliveries..." class="w-full sm:w-64" @update:modelValue="deliveryStore.handleSearch" />
                            </div>
                        </div>

                        <ProTable
                            @search="handleSearch"
                            :data="filteredDeliveries"
                            :columns="deliveryListColumn"
                            :loading="deliveryStore.loading"
                            :pagination="deliveryStore.pagination"
                            emptyTitle="No delivery orders found"
                            @update:pagination="handleUpdatePagination"
                        >

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
