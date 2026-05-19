<script lang="ts" src="./Delivery.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div>
            <!-- Mobile Header Actions (Below Title) -->
            <div class="flex flex-row gap-2 w-full mb-4 lg:hidden">
                <ProButton @click="showSmartScanModal = true" variant="secondary" class="flex-1 justify-center px-2 text-sm sm:text-base">
                    <i class="pi pi-sparkles mt-0.5 mr-1 sm:mr-2 text-brand-primary" /> <span class="hidden sm:inline">Smart</span> AI Scan
                </ProButton>
                <ProButton @click="$router.push('/deliveries/createDelivery')" class="flex-1 justify-center px-2 text-sm sm:text-base">
                    <PhPlus :size="16" class="mr-1 sm:mr-2" /> New <span class="hidden sm:inline">Delivery Verification</span><span class="sm:hidden">Delivery</span>
                </ProButton>
            </div>

            <!-- Desktop Header Actions teleported to AppLayout -->
            <Teleport defer to="#page-header-actions">
                <div class="hidden lg:flex flex-row gap-2">
                    <ProButton @click="showSmartScanModal = true" variant="secondary">
                        <i class="pi pi-sparkles mt-0.5 mr-2 text-brand-primary" /> Smart AI Scan
                    </ProButton>
                    <ProButton @click="$router.push('/deliveries/createDelivery')" variant="primary">
                        <PhPlus :size="16" class="mr-2" /> New Delivery Verification
                    </ProButton>
                </div>
            </Teleport>

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
                                <ProSelect :modelValue="deliveryStore.pagination.pageSize" @update:modelValue="handleUpdatePagination({ page: 1, limit: Number($event) })" :options="[{label:'10', value:10}, {label:'25', value:25}, {label:'50', value:50}, {label:'100', value:100}]" class="w-24 text-sm" />
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

                        <!-- Desktop View -->
                        <div class="hidden lg:block">
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

                                <template #cell-RefDoc="{ row }">
                                    {{ row.RefDoc || row.purchase_order?.DocNo || '-' }}
                                </template>

                                <template #cell-SupplierName="{ row }">
                                    {{ row.supplier?.CompanyName || row.purchase_order?.supplier?.CompanyName || row.SupplierName || '-' }}
                                </template>

                                <template #cell-DocNo="{ row }">
                                    <button class="text-brand-primary hover:underline font-semibold" @click.prevent="handleAction('view', row)">
                                        {{ row.DocNo }}
                                    </button>
                                </template>

                                <template #cell-Date="{ row }">
                                    {{ formatDate(row.Date) }}
                                </template>

                                <template #cell-Status="{ row }">
                                    <div class="flex items-center gap-2">
                                        <ProTag 
                                            :label="row.Status" 
                                            :variant="getStatusSeverity(row.Status)" 
                                        />
                                        <i v-if="row.Status === 'Processing'" class="pi pi-spinner pi-spin text-brand-primary" />
                                    </div>
                                </template>

                                <template #actions="{ row }">
                                    <ProButton variant="secondary" size="sm" @click="handleAction('view', row)" title="View Delivery" :disabled="row.Status === 'Processing'">
                                        <PhEye :size="18" class="text-base text-gray-700" />
                                    </ProButton>
                                    <ProButton v-if="isPurchasingRole && row.Status === 'Pending'" variant="success" size="sm" class="ml-2" @click="handleAction('approve', row)" title="Approve Delivery">
                                        <PhCheckCircle :size="18" />
                                    </ProButton>
                                    <ProButton v-if="isPurchasingRole && row.Status === 'Pending'" variant="danger" size="sm" class="ml-2" @click="handleAction('reject', row)" title="Reject Delivery">
                                        <PhXCircle :size="18" />
                                    </ProButton>
                                    <ProButton v-if="row.Status === 'Failed'" variant="danger" size="sm" class="ml-2" @click="handleAction('delete', row)" title="Delete Failed Document">
                                        <PhTrash :size="18" />
                                    </ProButton>
                                </template>
                            </ProTable>
                        </div>

                        <!-- Mobile View -->
                        <div class="block lg:hidden mt-4">
                            <template v-if="filteredDeliveries.length > 0">
                                <div class="grid grid-cols-1 gap-4">
                                    <ProCard v-for="row in filteredDeliveries" :key="row.Id" class="shadow-sm relative overflow-visible">
                                        <div class="flex justify-between items-center mb-3">
                                            <div class="flex items-center gap-2">
                                                <i v-if="row.Status === 'Processing'" class="pi pi-spinner pi-spin text-brand-primary text-sm" />
                                                <ProTag :label="row.Status" :variant="getStatusSeverity(row.Status)" />
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <template v-if="(isPurchasingRole && row.Status === 'Pending') || row.Status === 'Failed'">
                                                    <ProMenu :width="160" placement="top-end">
                                                        <template #trigger="{ isOpen }">
                                                            <button
                                                                class="inline-flex items-center justify-center w-8 h-8 rounded-button transition-all duration-150 cursor-pointer -mr-2"
                                                                :class="isOpen ? 'bg-surface-gray-bg-strong text-text-heading' : 'text-text-body hover:bg-surface-gray-bg hover:text-text-heading'"
                                                                aria-label="More actions"
                                                            >
                                                                <PhDotsThreeVertical :size="16" weight="bold" />
                                                            </button>
                                                        </template>
                                                        <template #items="{ close }">
                                                            <div class="py-1">
                                                                <button
                                                                    class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-body hover:bg-surface-gray-bg transition-colors duration-100"
                                                                    @click.stop="close(); handleAction('view', row)"
                                                                >
                                                                    <PhEye :size="15" class="shrink-0 text-text-subtitle" />
                                                                    View
                                                                </button>
                                                                
                                                                <template v-if="isPurchasingRole && row.Status === 'Pending'">
                                                                    <button
                                                                        class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-body hover:bg-surface-gray-bg transition-colors duration-100"
                                                                        @click.stop="close(); handleAction('approve', row)"
                                                                    >
                                                                        <PhCheckCircle :size="15" class="shrink-0 text-green-600" />
                                                                        Approve
                                                                    </button>
                                                                    <div class="my-1 border-t border-border-border" />
                                                                    <button
                                                                        class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-error hover:bg-surface-error/20 transition-colors duration-100"
                                                                        @click.stop="close(); handleAction('reject', row)"
                                                                    >
                                                                        <PhXCircle :size="15" class="shrink-0 text-text-error" />
                                                                        Reject
                                                                    </button>
                                                                </template>

                                                                <template v-if="row.Status === 'Failed'">
                                                                    <div class="my-1 border-t border-border-border" />
                                                                    <button
                                                                        class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-error hover:bg-surface-error/20 transition-colors duration-100"
                                                                        @click.stop="close(); handleAction('delete', row)"
                                                                    >
                                                                        <PhTrash :size="15" class="shrink-0 text-text-error" />
                                                                        Delete
                                                                    </button>
                                                                </template>
                                                            </div>
                                                        </template>
                                                    </ProMenu>
                                                </template>
                                                <template v-else>
                                                    <ProButton variant="secondary" size="sm" @click="handleAction('view', row)" class="!px-2" title="View" :disabled="row.Status === 'Processing'">
                                                        <PhEye :size="16" />
                                                    </ProButton>
                                                </template>
                                            </div>
                                        </div>

                                        <div class="flex items-start gap-2 mb-4">
                                            <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ row.rowIndex }}</span>
                                            <div class="flex flex-col gap-0.5">
                                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">DO Number</span>
                                                <span class="font-semibold text-text-heading leading-tight">{{ row.DocNo }}</span>
                                            </div>
                                        </div>

                                        <div class="grid gap-2 mb-4">
                                            <div v-if="isPurchasingRole && row.ProjectName" class="flex justify-between items-center text-sm">
                                                <span class="text-gray-500 font-medium">Project</span>
                                                <span class="text-right">{{ row.ProjectName }}</span>
                                            </div>
                                            <div class="flex justify-between items-center text-sm">
                                                <span class="text-gray-500 font-medium">PO Number</span>
                                                <span class="text-right">{{ row.RefDoc || row.purchase_order?.DocNo || '-' }}</span>
                                            </div>
                                            <div class="flex justify-between items-center text-sm">
                                                <span class="text-gray-500 font-medium">Supplier</span>
                                                <span class="text-right">{{ row.supplier?.CompanyName || row.purchase_order?.supplier?.CompanyName || row.SupplierName || '-' }}</span>
                                            </div>
                                            <div class="flex justify-between items-center text-sm">
                                                <span class="text-gray-500 font-medium">Delivery Date</span>
                                                <span class="text-right">{{ formatDate(row.Date) }}</span>
                                            </div>
                                            <div class="flex justify-between items-center text-sm">
                                                <span class="text-gray-500 font-medium">Plate No</span>
                                                <span class="text-right">{{ row.PlateNo || '-' }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1 mt-2" v-if="row.Remark">
                                                <span class="text-xs font-medium text-gray-500">Remark</span>
                                                <span class="text-sm text-gray-700 whitespace-pre-wrap">{{ row.Remark }}</span>
                                            </div>
                                        </div>


                                    </ProCard>
                                </div>
                                
                                <div class="mt-6 flex justify-center">
                                    <ProPagination 
                                        :modelValue="deliveryStore.pagination.page" 
                                        @update:modelValue="(val: number) => handleUpdatePagination({ page: val, limit: deliveryStore.pagination.pageSize })"
                                        :totalPages="deliveryStore.pagination.totalPages" 
                                        :maxVisible="5" 
                                    />
                                </div>
                            </template>
                            
                            <div v-else class="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                                <PhTruck class="mx-auto text-gray-300 mb-3" :size="48" />
                                <h3 class="text-lg font-medium text-gray-900">No delivery orders found</h3>
                                <p class="text-gray-500 mt-1">Try adjusting your search or filters.</p>
                            </div>
                        </div>
                    </Motion>
                </ProTabs>
            </ProCard>
        </div>
    </Motion>

    <!-- Approve Modal -->
    <ProModal :modelValue="showApproveModal" @update:modelValue="(val: boolean) => { showApproveModal = val }" title="Confirm Approval" size="sm" class="!z-[1000]">
        <div class="flex flex-col gap-4">
            <p class="text-body-sm text-text-body">
                Are you sure you want to approve delivery order <span v-if="selectedDeliveryNo" class="text-body-sm-bold text-text-heading">{{ selectedDeliveryNo }}</span>?
            </p>
        </div>
        <template #footer>
            <div class="flex justify-end gap-3">
                <ProButton variant="secondary" @click="showApproveModal = false">
                    <template #iconLeft><PhX :size="16" /></template>
                    Cancel
                </ProButton>
                <ProButton variant="primary" @click="confirmApprove">
                    <template #iconLeft><PhCheck :size="16" /></template>
                    Yes, Approve
                </ProButton>
            </div>
        </template>
    </ProModal>

    <!-- Reject Modal -->
    <ProModal :modelValue="showRejectModal" @update:modelValue="(val: boolean) => { showRejectModal = val }" title="Confirm Rejection" size="sm" class="!z-[1000]">
        <div class="flex flex-col gap-4">
            <p class="text-body-sm text-text-body">
                Are you sure you want to reject delivery order <span v-if="selectedDeliveryNo" class="text-body-sm-bold text-text-heading">{{ selectedDeliveryNo }}</span>?
            </p>
        </div>
        <template #footer>
            <div class="flex justify-end gap-3">
                <ProButton variant="secondary" @click="showRejectModal = false">
                    <template #iconLeft><PhX :size="16" /></template>
                    Cancel
                </ProButton>
                <ProButton variant="danger" @click="confirmReject">
                    <template #iconLeft><PhCheck :size="16" /></template>
                    Yes, Reject
                </ProButton>
            </div>
        </template>
    </ProModal>

    <!-- Smart Scan Modal -->
    <SmartScanModal
        v-model="showSmartScanModal"
        @start-scan="handleSmartScanStart"
        @manual="handleSmartScanManual"
    />
</template>
