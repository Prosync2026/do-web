<script lang="ts" src="./review.script"></script>

<template>
    <div class="p-mb-5 mt-5">
        <Message severity="secondary" variant="outlined" :closable="false">
            <i class="pi pi-receipt"></i>
            Review all delivery information before saving. Make sure all details are accurate.
        </Message>
        <form @submit.prevent="onFormSubmit" class="flex flex-col gap-4 mt-4">
            <div class="flex flex-col md:flex-row gap-4 mt-4">
                <ProCard class="flex-1 shadow-sm">
                    <div class="flex items-center mb-4">
                        <i class="pi pi-truck mr-2"></i>
                        <span class="text-base font-semibold">Delivery Information</span>
                    </div>
                    <div class="grid gap-2 text-sm">
                        <div class="flex justify-between">
                            <span class="font-medium">Driver Plate:</span>
                            <span> {{ deliveryInfo?.PlateNo }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Delivery Date:</span>
                            <span>{{ formatDate(deliveryInfo?.DeliveryDate) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Attachments:</span>
                            <span>{{ deliveryInfo?.attachments?.length || 0 }} uploaded</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Delivery Photos Evidence:</span>
                            <span>{{ deliveryInfo?.attachments2?.length || 0 }} uploaded</span>
                        </div>
                    </div>
                </ProCard>

                <ProCard class="flex-1 shadow-sm">
                    <div class="flex items-center mb-4">
                        <i class="pi pi-box mr-2"></i>
                        <span class="text-base font-semibold">Purchase Order</span>
                    </div>
                    <div class="grid gap-2 text-sm">
                        <div class="flex justify-between">
                            <span class="font-medium">PO Number:</span>
                            <span>{{ selectPO?.DocNo || selectPO?.poNumber || '-' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Total Items:</span>
                            <span>{{ verifyItem?.length }}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Items Delivered:</span>
                            <ProTag variant="secondary" class="text-gray-800" label="-" />
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Status:</span>
                            <ProTag variant="secondary" class="text-gray-800" label="Pending" />
                        </div>
                    </div>
                </ProCard>
            </div>

            <div class="grid mt-4 w-full" style="min-width: 0;">
                <div class="col-12" style="min-width: 0;">
                    <ProCard class="shadow-sm">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-2 lg:mb-4 gap-2">
                            <h3 class="text-lg font-semibold">Items Summary</h3>
                            <!-- Mobile Tab Scroll Indicator -->
                            <div class="flex items-center text-xs text-gray-400 lg:hidden justify-end">
                                <span class="italic mr-1">Swipe table</span>
                                <PhArrowsLeftRight :size="14" class="animate-pulse" />
                            </div>
                        </div>
                        <div class="w-full overflow-x-auto">
                            <ProTable v-if="hasDeliveredItems" :data="deliveredItems" :columns="deliveryListColumn" emptyTitle="No Delivered Items" :loading="false" />
                        </div>
                    </ProCard>
                </div>
            </div>

            <div class="flex justify-end mt-4 gap-2">
                <ProButton type="button" variant="secondary" @click="goBack">Cancel</ProButton>
                <ProButton type="submit">Save Delivery Verification</ProButton>
            </div>
        </form>
    </div>
</template>
