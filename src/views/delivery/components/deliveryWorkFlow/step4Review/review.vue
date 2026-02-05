<script lang="ts" src="./review.script"></script>

<template>
    <div class="p-mb-5 mt-5">
        <Message severity="secondary" variant="outlined" :closable="false">
            <i class="pi pi-receipt"></i>
            Review all delivery information before saving. Make sure all details are accurate.
        </Message>
        <Form @submit="onFormSubmit" class="flex flex-col gap-4 mt-4">
            <div class="flex flex-col md:flex-row gap-4 mt-4">
                <Card class="flex-1 border">
                    <template #title>
                        <i class="pi pi-truck mr-2"></i>
                        <span class="text-base font-semibold">Delivery Information</span>
                    </template>
                    <template #content>
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
                    </template>
                </Card>

                <Card class="flex-1 border">
                    <template #title>
                        <i class="pi pi-box mr-2"></i>
                        <span class="text-base font-semibold">Purchase Order</span>
                    </template>
                    <template #content>
                        <div class="grid gap-2 text-sm">
                            <div class="flex justify-between">
                                <span class="font-medium">PO Number:</span>
                                <span>{{ selectPO?.DocNo || selectPO?.poNumber || '-' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Total Items:</span>
                                <span>{{ verifyItem?.length }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Items Delivered:</span>
                                <Badge severity="secondary" class="text-gray-800">-</Badge>
                            </div>
                            <div class="flex justify-between">
                                <span class="font-medium">Status:</span>
                                <Badge severity="secondary" class="text-gray-800"> Pending </Badge>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <div class="grid mt-4">
                <div class="col-12">
                    <Card class="border">
                        <template #content>
                            <h3 class="text-lg font-semibold mb-2">Items Summary</h3>
                            <ReusableTable v-if="hasDeliveredItems" :value="deliveredItems" :columns="deliveryListColumn" emptyTitle="No Delivered Items" :loading="false" />
                        </template>
                    </Card>
                </div>
            </div>

            <div class="flex justify-end mt-4 gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="goBack" />
                <Button type="submit" label="Save Delivery Verification" severity="primary" />
            </div>
        </Form>
    </div>
</template>
