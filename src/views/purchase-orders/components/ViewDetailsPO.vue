<script lang="ts" src="./ViewDetailsPO.script"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-1">
            <!-- PO Info Card -->
            <ProCard class="mx-3 mb-6">
                <h2 class="text-body-bold text-text-heading mb-4">Purchase Order Information</h2>
                <div class="grid grid-cols-3 gap-6">
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">PO Number</p>
                        <p class="text-body-sm text-text-body">{{ poNumber }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Supplier</p>
                        <p class="text-body-sm text-text-body">{{ supplier }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Total Amount</p>
                        <p class="text-body-sm text-text-body">{{ totalAmount }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">RO Number</p>
                        <p class="text-body-sm text-text-body">{{ roNumber }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">PO Date</p>
                        <p class="text-body-sm text-text-body">{{ date }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Status</p>
                        <ProTag
                            :label="status === 'Created' ? 'Pending' : status"
                            :variant="status === 'Completed' ? 'success' : status === 'Partially Delivered' ? 'warn' : 'info'"
                        />
                    </div>
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Project</p>
                        <p class="text-body-sm text-text-body">{{ project?.name }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Delivery Date</p>
                        <p class="text-body-sm text-text-body">{{ deliveryDate }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm-bold text-text-subtitle mb-1">Created By</p>
                        <p class="text-body-sm text-text-body">{{ createdBy }}</p>
                    </div>
                </div>
            </ProCard>

            <!-- Tabs -->
            <ProCard class="mx-3">
                <ProTabs v-model="activeTab" :tabs="tabItems">
                    <div v-if="activeTab === 'items'">
                        <ProTable :data="itemsWithNo" :columns="itemsColumns" :loading="isLoading">
                            <template #cell-status="{ row }">
                                <ProTag
                                    :label="row.status === 'Created' ? 'Pending' : row.status"
                                    :variant="getStatusVariant(row.status)"
                                />
                            </template>
                        </ProTable>
                    </div>

                    <div v-else-if="activeTab === 'delivery'">
                        <ProTable :data="itemsWithNo" :columns="itemsColumns" :loading="isLoading">
                            <template #cell-status="{ row }">
                                <ProTag
                                    :label="row.status === 'Created' ? 'Pending' : row.status"
                                    :variant="getStatusVariant(row.status)"
                                />
                            </template>
                        </ProTable>
                    </div>
                </ProTabs>
            </ProCard>
        </div>
    </Motion>
</template>
