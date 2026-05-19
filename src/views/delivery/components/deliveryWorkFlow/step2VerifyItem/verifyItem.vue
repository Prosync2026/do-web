<script lang="ts" src="./verifyItem.script"></script>

<template>
    <div class="p-mb-5">
        <div v-if="!isPoSelected" class="flex flex-col justify-center py-5 gap-4 w-full">
            <Message severity="warn" variant="outlined" :closable="false">
                <PhWarning :size="18" class="mr-2"  />
                Please select a Purchase Order before proceeding.
            </Message>

            <div class="flex justify-end mt-4 gap-2 w-full">
                <ProButton variant="secondary" @click="goBack">Back</ProButton>
            </div>
        </div>

        <div v-else>
            <ProBanner variant="info" title="Enter the actual quantities delivered for each item. Items marked as complete will be highlighted." />

            <ProCard class="mt-6 shadow-sm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 mb-4">
                        <div class="flex flex-col">
                            <label for="doNumber">DO Number (Optional)</label>
                            <ProInput name="doNumber" v-model="initialValues.doNumber" placeholder="Enter DO Number" fluid />
                        </div>
                        <div class="flex flex-col">
                            <label for="deliveryDate">Date</label>
                            <ProDatePicker name="deliveryDate" :modelValue="formatDateToAPI(initialValues.deliveryDate)" @update:modelValue="initialValues.deliveryDate = ($event ? new Date($event) : null)" placeholder="Select Date" class="w-full bg-gray-100 opacity-80 cursor-not-allowed" disabled readonly />
                            <Message v-if="errors.deliveryDate" severity="error" size="small" variant="simple">
                                {{ errors.deliveryDate }}
                            </Message>
                        </div>
                        <div class="flex flex-col md:col-span-2">
                            <label for="driverPlate">Plate Number</label>
                            <ProInput name="driverPlate" v-model="initialValues.driverPlate" placeholder="Plate Number" :class="{'border-red-500': errors.driverPlate}" fluid />
                            <Message v-if="errors.driverPlate" severity="error" size="small" variant="simple">
                                {{ errors.driverPlate }}
                            </Message>
                        </div>
                        <div class="flex flex-col md:col-span-2">
                            <label for="remarks">Remarks</label>
                            <ProTextarea name="remarks" v-model="initialValues.remarks" rows="2" placeholder="Additional Notes" />
                        </div>
                    </div>

                    <div class="flex flex-col gap-3 mb-4 mt-6">
                        <div class="flex items-center justify-between w-full">
                            <span class="font-bold text-lg text-gray-900">Key in delivered quantities</span>
                            <ProTag :label="poNumber" variant="info" class="text-blue-600 bg-blue-50 border border-blue-200" />
                        </div>
                    </div>
                    <Form @submit="onFormSubmit" class="flex flex-col gap-4 mt-1 w-full sm:w-full">
                        <div class="grid grid-cols-1 gap-4 p-3">
                            <ProCard v-for="(item, index) in itemList" :key="index" class="border rounded-lg shadow-sm">
                                    <div class="flex flex-col mb-4">
                                        <span class="font-bold text-base text-gray-900">{{ item.order }} — {{ item.name }}</span>
                                        <span class="text-sm text-gray-500">PO Qty: {{ item.total }} {{ item.uom }}</span>
                                    </div>

                                    <div v-for="(split, sIndex) in item.splits" :key="split._id || sIndex" class="mb-4 pb-4" :class="{ 'border-b border-gray-100': sIndex < item.splits.length - 1 }">
                                        <div class="grid grid-cols-2 gap-4 mb-3">
                                            <div class="flex flex-col">
                                                <label class="text-xs font-medium text-gray-700 mb-1">Delivered</label>
                                                <ProInput v-model="split.delivered" type="number" :min="0" />
                                            </div>
                                            <div class="flex flex-col">
                                                <label class="text-xs font-medium text-gray-700 mb-1">Received</label>
                                                <ProInput v-model="split.received" type="number" :min="0" />
                                            </div>
                                        </div>
                                        <div class="flex flex-col mb-3">
                                            <label class="text-xs font-medium text-gray-700 mb-1">Location</label>
                                            <ProSelect v-model="split.location" :options="locationOptions" placeholder="Select..." fluid />
                                        </div>
                                        <div class="flex flex-col mb-3">
                                            <label class="text-xs font-medium text-gray-700 mb-1">Remarks</label>
                                            <ProInput v-model="split.remarks" placeholder="Notes" fluid />
                                        </div>
                                        
                                        <div class="flex justify-end" v-if="item.splits.length > 1">
                                             <ProButton type="button" variant="text" severity="danger" size="small" class="p-0" @click="removeSplit(index, sIndex)">Remove</ProButton>
                                        </div>
                                    </div>
                                    
                                    <ProButton type="button" variant="outlined" class="w-full mt-2 border-brand-primary text-brand-primary font-semibold" @click="addSplit(index)">
                                        <i class="pi pi-list mr-2"></i> Split Delivery
                                    </ProButton>
                            </ProCard>
                        </div>

                        <div class="flex justify-end mt-4 gap-2">
                            <ProButton type="button" variant="secondary" @click="goBack">Back</ProButton>
                            <ProButton type="submit">Next</ProButton>
                        </div>
                    </Form>
            </ProCard>
        </div>
    </div>
</template>
