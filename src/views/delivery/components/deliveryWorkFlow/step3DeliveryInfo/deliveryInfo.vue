<script lang="ts" src="./deliveryInfo.script"></script>

<template>
    <div class="p-mb-5 mt-5">
        <Message severity="secondary" variant="outlined" :closable="false">
            <PhWarningCircle :size="18"  />
            Provide delivery information. Plate number and photos are optional - you can proceed directly.
        </Message>

        <ProCard class="mt-6 shadow-sm">
            <div class="flex items-center gap-2 mb-6 text-xl font-bold">
                <PhTruck :size="18"  />
                <span>Delivery Information</span>
            </div>
            <form @submit.prevent="onFormSubmit" class="flex flex-col gap-4 mt-1 w-full">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
                        <div class="flex flex-col">
                            <label for="driverPlate">Driver Plate Number</label>
                            <ProInput name="driverPlate" v-model="initialValues.driverPlate" placeholder="Plate Number" fluid />
                            <Message v-if="errors.driverPlate" severity="error" size="small" variant="simple">
                                {{ errors.driverPlate }}
                            </Message>
                        </div>

                        <div class="flex flex-col">
                            <label for="deliveryDate">Delivery Date</label>
                            <Calendar name="deliveryDate" v-model="initialValues.deliveryDate" placeholder="Select Date" showIcon :showTime="false" dateFormat="yy-mm-dd" class="w-full" />
                            <Message v-if="errors.deliveryDate" severity="error" size="small" variant="simple">
                                {{ errors.deliveryDate }}
                            </Message>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-4 p-3">
                        <div class="flex flex-col">
                            <label for="remarks">Additional Remarks</label>
                            <ProTextarea name="remarks" v-model="initialValues.remarks" rows="5" />
                        </div>
                    </div>

                    <!-- ATTACHMENTS (Delivery Documents) -->
                    <div class="grid grid-cols-1 gap-4 p-3">
                        <label class="font-semibold text-gray-800 flex items-center">
                            <PhFile :size="18" class="mr-2"  />
                            Attachments (Delivery Documents - optional, max 10MB)
                        </label>
                        <ProUploadFile v-model="deliveryAttachments" multiple accept="image/*" :maxSize="10" />
                    </div>

                    <!-- EVIDENCE FILES (Photos) -->
                    <div class="grid grid-cols-1 gap-4 p-3 mt-4">
                        <label class="font-semibold text-gray-800 flex items-center">
                            <PhCamera :size="18" class="mr-2"  />
                            Delivery Evidence Photos (optional, max 10MB)
                        </label>
                        <ProUploadFile v-model="evidenceFiles" multiple accept="image/*" :maxSize="10" />
                    </div>

                    <div class="flex justify-end mt-4">
                        <ProButton type="button" variant="secondary" @click="goBack">Cancel</ProButton>
                        <ProButton type="submit" class="ms-2">Next</ProButton>
                    </div>
                </form>
        </ProCard>
    </div>
</template>
