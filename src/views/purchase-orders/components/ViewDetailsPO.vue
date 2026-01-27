<script lang="ts" src="./ViewDetailsPO.script"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-6 card glossy-card">
            <BreadcrumbList />
            <!-- Header -->
            <h1 class="text-xl font-bold">Purchase Order</h1>
            <p class="text-sm text-gray-500">{{ poNumber }} - {{ project?.name }}</p>

            <!-- PO Info -->
            <div class="mt-4 p-4 border rounded">
                <h2 class="font-semibold mb-2">Purchase Order Information</h2>
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p class="font-semibold">PO Number</p>
                        <p>{{ poNumber }}</p>
                    </div>
                    <div>
                        <p class="font-semibold">Supplier</p>
                        <p>{{ supplier }}</p>
                    </div>
                    <div>
                        <p class="font-semibold">Total Amount</p>
                        <p>{{ totalAmount }}</p>
                    </div>
                    <div>
                        <p class="font-semibold">RO Number</p>
                        <p>{{ roNumber }}</p>
                    </div>
                    <div>
                        <p class="font-semibold">PO Date</p>
                        <p>{{ date }}</p>
                    </div>
                    <div>
                        <p class="font-semibold">Status</p>
                        <p><Tag :value="status === 'Created' ? 'Pending' : status" :severity="status === 'Completed' ? 'success' : status === 'Partially Delivered' ? 'warn' : 'info'" /></p>
                    </div>
                    <div>
                        <p class="font-semibold">Project</p>
                        <p>{{ project?.name }}</p>
                    </div>
                    <div>
                        <p class="font-semibold">Delivery Date</p>
                        <p>{{ deliveryDate }}</p>
                    </div>
                    <div>
                        <p class="font-semibold">Created By</p>
                        <p>{{ createdBy }}</p>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="mt-6">
                <BaseTab v-model="activeTab" :tabs="tabItems">
                    <template #default="{ activeTab }">
                        <div v-if="activeTab === 'items'">
                            <ReusableTable :value="itemsWithNo" :columns="itemsColumns">
                                <template #no="{ data }">
                                    {{ data.no }}
                                </template>

                                <template #status="{ data }">
                                    <Tag :value="data.status === 'Created' ? 'Pending' : data.status" :severity="data.status.toLowerCase() === 'completed' ? 'success' : data.status.toLowerCase() === 'partially delivered' ? 'warn' : 'info'" />
                                </template>
                            </ReusableTable>
                        </div>

                        <div v-else-if="activeTab === 'delivery'">
                            <p>Delivery orders list</p>
                            <ReusableTable :value="itemsWithNo" :columns="itemsColumns">
                                <template #no="{ data }">
                                    {{ data.no }}
                                </template>

                                <template #status="{ data }">
                                    <Tag :value="data.status === 'Created' ? 'Pending' : data.status" :severity="data.status.toLowerCase() === 'completed' ? 'success' : data.status.toLowerCase() === 'partially delivered' ? 'warn' : 'info'" />
                                </template>
                            </ReusableTable>
                        </div>
                    </template>
                </BaseTab>
            </div>
        </div>
    </Motion>
</template>
