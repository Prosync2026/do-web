<script lang="ts" src="./ViewDetailsPO.script"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-1">
            <!-- PO Info Card -->
            <ProCard class="mx-3 mb-6">
                <h2 class="text-body-bold text-text-heading mb-4">Purchase Order Information</h2>
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">PO Number</p>
                        <p class="text-body-sm text-text-body truncate">{{ poNumber }}</p>
                    </div>
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Supplier</p>
                        <p class="text-body-sm text-text-body truncate" :title="supplier">{{ supplier }}</p>
                    </div>
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Total Amount</p>
                        <p class="text-body-sm text-text-body truncate">{{ totalAmount }}</p>
                    </div>
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">RO Number</p>
                        <p class="text-body-sm text-text-body truncate">{{ roNumber }}</p>
                    </div>
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">PO Date</p>
                        <p class="text-body-sm text-text-body truncate">{{ date }}</p>
                    </div>
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Status</p>
                        <ProTag
                            :label="status === 'Created' ? 'Pending' : status"
                            :variant="status === 'Completed' ? 'success' : status === 'Partially Delivered' ? 'warn' : 'info'"
                        />
                    </div>
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Project</p>
                        <p class="text-body-sm text-text-body truncate" :title="project?.name">{{ project?.name }}</p>
                    </div>
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Delivery Date</p>
                        <p class="text-body-sm text-text-body truncate">{{ deliveryDate }}</p>
                    </div>
                    <div class="min-w-0">
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Created By</p>
                        <p class="text-body-sm text-text-body break-all">{{ createdBy }}</p>
                    </div>
                </div>
            </ProCard>

            <!-- Tabs -->
            <ProCard class="mx-3">
                <ProTabs v-model="activeTab" :tabs="tabItems">
                    <div v-if="activeTab === 'items'">
                        <div class="hidden lg:block">
                            <ProTable :data="itemsWithNo" :columns="itemsColumns" :loading="isLoading">
                                <template #cell-status="{ row }">
                                    <ProTag
                                        :label="row.status === 'Created' ? 'Pending' : row.status"
                                        :variant="getStatusVariant(row.status)"
                                    />
                                </template>
                            </ProTable>
                        </div>
                        <div class="block lg:hidden mt-4">
                            <div v-if="itemsWithNo.length === 0 && !isLoading" class="text-center text-gray-500 py-6">No items found</div>
                            <div v-else class="grid grid-cols-1 gap-4">
                                <ProCard v-for="(item, index) in itemsWithNo" :key="index" class="shadow-sm border border-gray-200">
                                    <div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                                        <div class="flex items-start gap-2">
                                            <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ item.no }}</span>
                                            <div class="flex flex-col gap-0.5 mt-0.5">
                                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Item Code</span>
                                                <span class="font-semibold text-text-heading leading-tight">{{ item.code }}</span>
                                            </div>
                                        </div>
                                        <ProTag
                                            :label="item.status === 'Created' ? 'Pending' : item.status"
                                            :variant="getStatusVariant(item.status)"
                                            class="ml-2 whitespace-nowrap"
                                        />
                                    </div>
                                    <div class="grid gap-3">
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-medium text-gray-500">Description</span>
                                            <span class="text-sm font-medium">{{ item.description }}</span>
                                        </div>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">Ordered</span>
                                                <span class="text-sm">{{ item.ordered }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">Unit Price</span>
                                                <span class="text-sm">{{ item.unitPrice }}</span>
                                            </div>
                                        </div>
                                        <div class="flex flex-col gap-1 pt-2 border-t border-gray-100">
                                            <span class="text-xs font-medium text-gray-500">Amount</span>
                                            <span class="text-sm font-semibold text-text-heading">{{ item.amount }}</span>
                                        </div>
                                    </div>
                                </ProCard>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="activeTab === 'delivery'">
                        <div class="hidden lg:block">
                            <ProTable :data="itemsWithNo" :columns="itemsColumns" :loading="isLoading">
                                <template #cell-status="{ row }">
                                    <ProTag
                                        :label="row.status === 'Created' ? 'Pending' : row.status"
                                        :variant="getStatusVariant(row.status)"
                                    />
                                </template>
                            </ProTable>
                        </div>
                        <div class="block lg:hidden mt-4">
                            <div v-if="itemsWithNo.length === 0 && !isLoading" class="text-center text-gray-500 py-6">No delivery orders found</div>
                            <div v-else class="grid grid-cols-1 gap-4">
                                <ProCard v-for="(item, index) in itemsWithNo" :key="index" class="shadow-sm border border-gray-200">
                                    <div class="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                                        <div class="flex items-start gap-2">
                                            <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ item.no }}</span>
                                            <div class="flex flex-col gap-0.5 mt-0.5">
                                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Item Code</span>
                                                <span class="font-semibold text-text-heading leading-tight">{{ item.code }}</span>
                                            </div>
                                        </div>
                                        <ProTag
                                            :label="item.status === 'Created' ? 'Pending' : item.status"
                                            :variant="getStatusVariant(item.status)"
                                            class="ml-2 whitespace-nowrap"
                                        />
                                    </div>
                                    <div class="grid gap-3">
                                        <div class="flex flex-col gap-1">
                                            <span class="text-xs font-medium text-gray-500">Description</span>
                                            <span class="text-sm font-medium">{{ item.description }}</span>
                                        </div>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">Ordered</span>
                                                <span class="text-sm">{{ item.ordered }}</span>
                                            </div>
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-medium text-gray-500">Unit Price</span>
                                                <span class="text-sm">{{ item.unitPrice }}</span>
                                            </div>
                                        </div>
                                        <div class="flex flex-col gap-1 pt-2 border-t border-gray-100">
                                            <span class="text-xs font-medium text-gray-500">Amount</span>
                                            <span class="text-sm font-semibold text-text-heading">{{ item.amount }}</span>
                                        </div>
                                    </div>
                                </ProCard>
                            </div>
                        </div>
                    </div>
                </ProTabs>
            </ProCard>
        </div>
    </Motion>
</template>
