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
                
                <!-- Mobile Tab Scroll Indicator -->
                <div class="flex items-center text-xs text-gray-400 mb-2 lg:hidden w-full justify-end">
                    <span class="italic mr-1">Swipe tabs</span>
                    <PhArrowsLeftRight :size="14" class="animate-pulse" />
                </div>

                <ProTabs v-model="activeTab" :tabs="tabItems" @update:modelValue="handleTabChange" class="pro-tabs-scrollable">
                    <Motion :key="activeTab" :initial="{ opacity: 0, x: 30 }" :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: -30 }" :transition="{ duration: 0.8 }">

                        <!-- Shared Toolbar for all tabs -->
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-gray-600">Rows per page:</span>
                                <ProSelect :modelValue="store.pagination.pageSize" @update:modelValue="handleUpdatePagination({ page: 1, pageSize: $event })" :options="[{label:'10', value:10}, {label:'25', value:25}, {label:'50', value:50}, {label:'100', value:100}]" class="w-24 text-sm" />
                            </div>
                            <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-wrap sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                                <div class="flex items-center gap-2 w-full sm:w-auto">
                                    <div class="flex-1 sm:w-36">
                                        <ProDatePicker v-model="startDate" placeholder="Start Date" appendTo="body" @update:modelValue="onSearchWrapper('')" />
                                    </div>
                                    <span class="text-text-subtitle">-</span>
                                    <div class="flex-1 sm:w-36">
                                        <ProDatePicker v-model="endDate" placeholder="End Date" appendTo="body" @update:modelValue="onSearchWrapper('')" />
                                    </div>
                                </div>
                                <div class="w-full sm:w-48" v-if="isPurchasingRole">
                                    <ProSelect v-model="store.filters.projectId" :options="[{ label: 'All Projects', value: '' }, ...projectStore.projectOptions]" placeholder="All Projects" @update:modelValue="onSearchWrapper('')" />
                                </div>
                                <ProInput :modelValue="store.filters.search" placeholder="Search purchase orders..." class="w-full sm:w-64" @update:modelValue="store.handleSearch" />
                            </div>
                        </div>

                        <!-- =====================
                             PENDING
                        ====================== -->
                        <template v-if="activeTab === '0'">
                            <div class="hidden lg:block">
                                <ProTable
                                    :data="pendingList"
                                    :columns="pendingListColumn"
                                    :loading="isLoading"
                                    :pagination="pagination"
                                    emptyTitle="No Pending Purchase Orders Found"
                                    @update:pagination="handleUpdatePagination"
                                >
                                    <template #cell-poNumber="{ row }">
                                        <button class="text-brand-primary hover:underline font-semibold" @click.prevent="viewPO(row)">
                                            {{ row.poNumber }}
                                        </button>
                                    </template>

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
                                            <PhEye :size="18" class="text-base text-gray-700"  />
                                        </ProButton>
                                    </template>
                                </ProTable>
                            </div>

                            <div class="block lg:hidden mt-4">
                                <div v-if="pendingList.length === 0" class="text-center text-gray-500 py-6">No Pending Purchase Orders Found</div>
                                <div v-else class="grid grid-cols-1 gap-4">
                                    <ProCard v-for="(row, index) in pendingList" :key="index" class="shadow-sm border border-gray-200">
                                        <div class="flex justify-between items-center mb-3">
                                            <ProTag
                                                :label="row.status === 'Created' ? 'Pending' : row.status"
                                                :variant="row.status === 'Completed' ? 'success' : row.status === 'Partially Delivered' ? 'warn' : 'info'"
                                                class="whitespace-nowrap"
                                            />
                                            <div class="flex items-center">
                                                <ProButton variant="secondary" size="sm" @click="viewPO(row)" class="!px-2" title="View">
                                                    <PhEye :size="16" />
                                                </ProButton>
                                            </div>
                                        </div>
                                        <div class="flex items-start gap-2 mb-4">
                                            <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ row.no }}</span>
                                            <div class="flex flex-col gap-0.5">
                                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">PO Number</span>
                                                <span class="font-semibold text-text-heading leading-tight">{{ row.poNumber }}</span>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 gap-4 mb-3">
                                            <div v-if="isPurchasingRole" class="flex flex-col gap-1 col-span-2">
                                                <span class="text-xs font-medium text-gray-500">Project</span>
                                                <span class="text-sm font-medium">{{ row.projectName || '-' }}</span>
                                            </div>
                                            
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">Supplier</span>
                                                <span class="text-sm">{{ row.supplier || '-' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">PO Date</span>
                                                <span class="text-sm">{{ row.poDate || '-' }}</span>
                                            </div>
                                        </div>

                                        <div class="flex flex-col gap-0.5 mt-3 pt-3 border-t border-gray-100" v-if="canViewPricing">
                                            <span class="text-xs font-medium text-gray-500">Total Amount</span>
                                            <span class="font-semibold text-text-heading">RM {{ Number(row.totalAmount).toLocaleString() }}</span>
                                        </div>
                                    </ProCard>
                                </div>
                            </div>
                        </template>

                        <!-- =====================
                             PARTIAL DELIVERY
                        ====================== -->
                        <template v-else-if="activeTab === '1'">
                            <div class="hidden lg:block">
                                <ProTable
                                    :data="partiallyList"
                                    :columns="partiallyListColumn"
                                    :loading="isLoading"
                                    :pagination="pagination"
                                    emptyTitle="No Partially Delivered Purchase Orders Found"
                                    @update:pagination="handleUpdatePagination"
                                >
                                    <template #cell-poNumber="{ row }">
                                        <button class="text-brand-primary hover:underline font-semibold" @click.prevent="viewPO(row)">
                                            {{ row.poNumber }}
                                        </button>
                                    </template>

                                    <template #cell-status="{ row }">
                                        <ProTag label="Partially Delivered" variant="warn" />
                                    </template>
                                </ProTable>
                            </div>

                            <div class="block lg:hidden mt-4">
                                <div v-if="partiallyList.length === 0" class="text-center text-gray-500 py-6">No Partially Delivered Purchase Orders Found</div>
                                <div v-else class="grid grid-cols-1 gap-4">
                                    <ProCard v-for="(row, index) in partiallyList" :key="index" class="shadow-sm border border-gray-200">
                                        <div class="flex justify-between items-center mb-3">
                                            <ProTag label="Partially Delivered" variant="warn" class="whitespace-nowrap" />
                                        </div>
                                        <div class="flex items-start gap-2 mb-4">
                                            <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ row.no }}</span>
                                            <div class="flex flex-col gap-0.5">
                                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">PO Number</span>
                                                <span class="font-semibold text-text-heading leading-tight">{{ row.poNumber }}</span>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 gap-4">
                                            <div v-if="isPurchasingRole" class="flex flex-col gap-1 col-span-2">
                                                <span class="text-xs font-medium text-gray-500">Project</span>
                                                <span class="text-sm font-medium">{{ row.projectName || '-' }}</span>
                                            </div>
                                            
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">Supplier</span>
                                                <span class="text-sm">{{ row.supplier || '-' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">PO Date</span>
                                                <span class="text-sm">{{ row.poDate || '-' }}</span>
                                            </div>
                                        </div>
                                    </ProCard>
                                </div>
                            </div>
                        </template>

                        <!-- =====================
                             COMPLETED
                        ====================== -->
                        <template v-else-if="activeTab === '2'">
                            <div class="hidden lg:block">
                                <ProTable
                                    :data="completedList"
                                    :columns="completedListColumn"
                                    :loading="isLoading"
                                    :pagination="pagination"
                                    emptyTitle="No Completed Purchase Orders Found"
                                    @update:pagination="handleUpdatePagination"
                                >
                                    <template #cell-poNumber="{ row }">
                                        <button class="text-brand-primary hover:underline font-semibold" @click.prevent="viewPO(row)">
                                            {{ row.poNumber }}
                                        </button>
                                    </template>

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
                            </div>

                            <div class="block lg:hidden mt-4">
                                <div v-if="completedList.length === 0" class="text-center text-gray-500 py-6">No Completed Purchase Orders Found</div>
                                <div v-else class="grid grid-cols-1 gap-4">
                                    <ProCard v-for="(row, index) in completedList" :key="index" class="shadow-sm border border-gray-200">
                                        <div class="flex justify-between items-center mb-3">
                                            <ProTag label="Completed" variant="success" class="whitespace-nowrap" />
                                        </div>
                                        <div class="flex items-start gap-2 mb-4">
                                            <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ row.no }}</span>
                                            <div class="flex flex-col gap-0.5">
                                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">PO Number</span>
                                                <span class="font-semibold text-text-heading leading-tight">{{ row.poNumber }}</span>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 gap-4 mb-3">
                                            <div class="flex flex-col gap-1 col-span-2">
                                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">DO Number</span>
                                                <span class="text-sm font-semibold text-text-heading">{{ row.doNumber || '-' }}</span>
                                            </div>

                                            <div v-if="isPurchasingRole" class="flex flex-col gap-1 col-span-2">
                                                <span class="text-xs font-medium text-gray-500">Project</span>
                                                <span class="text-sm font-medium">{{ row.projectName || '-' }}</span>
                                            </div>
                                            
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">PO Date</span>
                                                <span class="text-sm">{{ row.poDate || '-' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">Received By</span>
                                                <span class="text-sm">{{ row.receivedBy || '-' }}</span>
                                            </div>
                                        </div>

                                        <div class="mt-2 pt-3 border-t border-gray-100">
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">Discrepancy</span>
                                                <ProTag
                                                    class="self-start"
                                                    :label="row.discrepancyType || 'None'"
                                                    :variant="row.discrepancyType === 'Partial Delivery' ? 'warn' : row.discrepancyType ? 'error' : 'info'"
                                                />
                                            </div>
                                        </div>
                                    </ProCard>
                                </div>
                            </div>
                        </template>

                    </Motion>
                </ProTabs>
            </ProCard>
        </div>
    </Motion>
</template>
