<script lang="ts" src="./ViewDelivery.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
        <div class="p-1">
            <ProCard class="shadow-sm mb-6">
                <!-- <h1 class="text-h2 text-text-heading">Delivery Order</h1>
                <p class="text-body-sm text-text-subtitle">{{ singleDelivery?.DocNo }} - {{ singleDelivery?.RefDoc }}</p> -->

                <div v-if="loading" class="mt-4 text-center text-gray-500">Loading...</div>

                <div v-else-if="singleDelivery" class="mt-6">
                    <h2 class="font-semibold text-text-heading mb-4">Delivery Order Information</h2>
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-6 text-sm mb-6 pb-6 border-b border-gray-100">
                        <div>
                            <p class="text-text-subtitle text-xs uppercase tracking-wider mb-1">DO Number</p>
                            <p class="font-medium text-text-heading">{{ singleDelivery.DocNo }}</p>
                        </div>
                        <div>
                            <p class="text-text-subtitle text-xs uppercase tracking-wider mb-1">PO Number</p>
                            <p class="font-medium text-text-heading">{{ singleDelivery.RefDoc || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-text-subtitle text-xs uppercase tracking-wider mb-1">Driver Plate</p>
                            <p class="font-medium text-text-heading">{{ singleDelivery.PlateNo || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-text-subtitle text-xs uppercase tracking-wider mb-1">Delivery Date</p>
                            <p class="font-medium text-text-heading">{{ formatDate(singleDelivery.Date) || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-text-subtitle text-xs uppercase tracking-wider mb-1">Status</p>
                            <ProTag :label="singleDelivery.Status" :variant="singleDelivery.Status === 'Pending' ? 'error' : 'success'" />
                        </div>
                    </div>

                    <!-- Attachments (Delivery Documents) -->
                    <div class="mb-6">
                        <h4 class="text-text-heading font-medium mb-3">Delivery Document</h4>
                        <div v-if="parsedAttachments.length > 0" class="flex flex-wrap gap-3">
                            <div v-for="(file, index) in parsedAttachments" :key="`attachment-${index}`" class="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                <PhFile :size="18" class="text-brand-primary text-lg"  />
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium text-text-heading">{{ file.filename }}</span>
                                    <span v-if="file.size" class="text-xs text-text-subtitle">{{ formatSize(file.size) }}</span>
                                </div>
                                <ProButton variant="secondary" size="sm" @click="previewAttachment(file)" title="Preview Attachment" class="ml-2">
                                    <PhEye :size="18"  />
                                </ProButton>
                            </div>
                        </div>
                        <div v-else class="text-text-subtitle italic text-sm">No delivery documents available.</div>
                    </div>

                    <!-- Evidence Photos -->
                    <div class="mb-2">
                        <h4 class="text-text-heading font-medium mb-3">Evidence Photos</h4>
                        <div v-if="parsedAttachment2.length > 0" class="flex flex-wrap gap-3">
                            <div v-for="(file, index) in parsedAttachment2" :key="`attachment2-${index}`" class="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                <PhImage :size="18" class="text-green-600 text-lg"  />
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium text-text-heading">{{ file.filename }}</span>
                                    <span v-if="file.size" class="text-xs text-text-subtitle">{{ formatSize(file.size) }}</span>
                                </div>
                                <ProButton variant="secondary" size="sm" @click="previewAttachment(file)" title="Preview Photo" class="ml-2">
                                    <PhEye :size="18"  />
                                </ProButton>
                            </div>
                        </div>
                        <div v-else class="text-text-subtitle italic text-sm">No evidence photos available.</div>
                    </div>
                </div>
            </ProCard>

            <ProCard class="shadow-sm mt-6">
                <!-- Table -->
                <ProTable 
                    :data="items" 
                    :columns="itemsColumns" 
                    :onSearch="onSearchWrapper" 
                    emptyTitle="No Delivery Items Found"
                >
                    <template #cell-no="{ row }">{{ row.no }}</template>
                    <template #cell-DeliveryDate="{ row }">{{ formatDate(row.DeliveryDate) }}</template>
                    <template #cell-status="{ row }">
                        <ProTag :label="row.status" :variant="row.status === 'Completed' ? 'success' : 'warn'" />
                    </template>
                </ProTable>
            </ProCard>
        </div>
    </Motion>
</template>
