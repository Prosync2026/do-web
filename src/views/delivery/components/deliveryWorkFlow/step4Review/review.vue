<script lang="ts" src="./review.script"></script>

<template>
    <div class="p-mb-5 mt-5">
        <ProBanner variant="info" title="Review your delivery order details before creating." />
        <form @submit.prevent="onFormSubmit" class="flex flex-col gap-4 mt-4">
            
            <ProCard class="shadow-sm">
                <div class="flex items-center mb-4">
                    <span class="text-xs font-bold text-gray-500 uppercase">Delivery Info</span>
                </div>
                <div class="grid grid-cols-[100px_1fr] sm:grid-cols-[150px_1fr] gap-y-2 text-sm">
                    <div class="font-semibold text-gray-400">DO Number</div>
                    <div class="text-gray-800">{{ verifyItem?.doNumber || 'Auto-generated' }}</div>
                    
                    <div class="font-semibold text-gray-400">PO Number</div>
                    <div class="text-gray-800">{{ selectPO?.DocNo || selectPO?.poNumber || '-' }}</div>
                    
                    <div class="font-semibold text-gray-400">Supplier</div>
                    <div class="text-gray-800">{{ selectPO?.supplier?.CompanyName || 'ABC Hardware Sdn Bhd' }}</div>
                    
                    <div class="font-semibold text-gray-400">Date</div>
                    <div class="text-gray-800">{{ formatDate(verifyItem?.deliveryDate) }}</div>
                    
                    <div class="font-semibold text-gray-400">Plate No.</div>
                    <div class="text-gray-800">{{ verifyItem?.driverPlate || '-' }}</div>
                </div>
            </ProCard>

            <ProCard class="shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-bold text-gray-500 uppercase">Items</span>
                    <ProTag variant="info" class="text-blue-600 bg-blue-50 border border-blue-200" :label="`${verifyItem?.items?.length || 0} items`" />
                </div>
                
                <div class="flex flex-col gap-3">
                    <div v-for="(item, index) in deliveredItems" :key="index" class="border border-gray-200 rounded-md p-3 shadow-sm bg-white">
                        <div class="font-bold text-gray-900 mb-1 text-base">{{ item.ItemCode }} — {{ item.Name }}</div>
                        <div class="text-sm text-gray-600 font-medium">Del: {{ item.Quantity }} &nbsp; Rcv: {{ item.Received }} <span class="text-gray-400 font-normal ml-1">{{ item.Uom }}</span></div>
                    </div>
                </div>
            </ProCard>

            <ProCard class="shadow-sm">
                <div class="flex items-center mb-4">
                    <span class="text-xs font-bold text-gray-500 uppercase">Attachments</span>
                </div>
                <div class="flex items-center gap-4 text-sm font-semibold text-gray-800">
                    <div class="flex items-center bg-gray-50 px-2 py-1 rounded">
                        <PhFileText :size="16" class="text-red-400 mr-2" weight="fill" />
                        {{ deliveryInfo?.attachments?.length || 0 }} DO docs
                    </div>
                    <div class="flex items-center bg-gray-50 px-2 py-1 rounded">
                        <PhCamera :size="16" class="text-blue-400 mr-2" weight="fill" />
                        {{ deliveryInfo?.attachments2?.length || 0 }} photos
                    </div>
                </div>
            </ProCard>

            <div class="flex flex-col sm:flex-row justify-between items-center mt-2 gap-4">
                <ProButton type="button" variant="secondary" @click="goBack" class="w-full sm:w-24 bg-gray-50 text-gray-700">Back</ProButton>
                
                <div class="flex gap-2 w-full sm:w-auto justify-end">
                    <ProButton type="button" variant="secondary" @click="cancel" class="bg-gray-50 text-gray-700">Cancel</ProButton>
                    <ProButton type="button" variant="secondary" @click="saveAsDraft" class="bg-gray-50 text-gray-700">Save as Draft</ProButton>
                    <ProButton type="submit" variant="primary">
                        <i class="pi pi-check mr-2"></i> Submit
                    </ProButton>
                </div>
            </div>
        </form>
    </div>
</template>
