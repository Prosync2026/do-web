<script lang="ts" src="./deliveryInfo.script"></script>

<template>
    <div class="p-mb-5 mt-5">
        <Message severity="secondary" variant="outlined" :closable="false">
            <i class="pi pi-exclamation-circle"></i>
            Provide delivery information. Plate number and photos are optional - you can proceed directly.
        </Message>

        <Card class="mt-6 border">
            <template #title> <i class="pi pi-truck"></i> Delivery Information </template>
            <template #content>
                <Form :initialValues="initialValues" :resolver="resolver" @submit="onFormSubmit" class="flex flex-col gap-4 mt-1 w-full">
                    <div class="grid grid-cols-2 gap-4 p-3">
                        <div class="flex flex-col">
                            <label for="driverPlate">Driver Plate Number</label>
                            <InputText name="driverPlate" placeholder="Plate Number" fluid />
                            <Message v-if="errors.driverPlate" severity="error" size="small" variant="simple">
                                {{ errors.driverPlate }}
                            </Message>
                        </div>

                        <div class="flex flex-col">
                            <label for="deliveryDate">Delivery Date</label>
                            <Calendar name="deliveryDate" placeholder="Select Date" showIcon :showTime="false" dateFormat="yy-mm-dd" />
                            <Message v-if="errors.deliveryDate" severity="error" size="small" variant="simple">
                                {{ errors.deliveryDate }}
                            </Message>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-4 p-3">
                        <div class="flex flex-col">
                            <label for="remarks">Additional Remarks</label>
                            <Textarea name="remarks" rows="5" cols="30" />
                        </div>
                    </div>

                    <!-- ATTACHMENTS (Delivery Documents) -->
                    <div class="grid grid-cols-1 gap-4 p-3">
                        <Toast ref="toastRef" />
                        <div>
                            <label class="font-semibold text-gray-800 flex items-center">
                                <i class="pi pi-file mr-2"></i>
                                Attachments (Delivery Documents - optional, max 10 files)
                            </label>
                        </div>
                        <FileUpload name="attachments" url="#" :multiple="true" :maxFileSize="10_000_000" accept="image/*" @select="onSelectedFiles">
                            <template #content="{ removeFileCallback }">
                                <div v-if="deliveryAttachments.length > 0" class="flex flex-wrap gap-4 pt-4">
                                    <div v-for="(file, index) of deliveryAttachments" :key="file.name + file.size" class="p-4 border flex flex-col items-center gap-2">
                                        <img v-if="file.preview" :src="file.preview" class="w-32 h-32 object-cover rounded border" />

                                        <span class="font-semibold text-ellipsis max-w-60">{{ file.name }}</span>
                                        <div>{{ formatSize(file.size) }}</div>

                                        <Badge value="Pending" severity="warn" />

                                        <Button icon="pi pi-times" @click="onRemoveFile(file, removeFileCallback, index)" variant="outlined" rounded severity="danger" />
                                    </div>
                                </div>
                            </template>

                            <template #empty>
                                <div class="flex flex-col items-center justify-center">
                                    <i class="pi pi-cloud-upload !border-2 !rounded-full !p-8 !text-4xl !text-muted-color" />
                                    <p class="mt-4 mb-0">Drag and drop files here</p>
                                </div>
                            </template>
                        </FileUpload>

                        <ProgressBar :value="totalSizePercent" :showValue="false" class="w-full h-1 mt-2" />
                    </div>

                    <!--  EVIDENCE FILES (Photos) → sent as attachment2 -->
                    <div class="grid grid-cols-1 gap-4 p-3 mt-4">
                        <div>
                            <label class="font-semibold text-gray-800 flex items-center">
                                <i class="pi pi-camera mr-2"></i>
                                Delivery Evidence Photos (optional, max 10 files)
                            </label>
                        </div>

                        <FileUpload name="deliveryEvidence" url="#" :multiple="true" :maxFileSize="10_000_000" accept="image/*" @select="onSelectedEvidenceFiles">
                            <template #content="{ removeFileCallback }">
                                <div v-if="evidenceFiles.length > 0" class="flex flex-wrap gap-4 pt-4">
                                    <div v-for="(file, index) of evidenceFiles" :key="file.name + file.size" class="p-4 border flex flex-col items-center gap-2">
                                        <img v-if="file.preview" :src="file.preview" class="w-32 h-32 object-cover rounded border" />

                                        <span class="font-semibold text-ellipsis max-w-60">{{ file.name }}</span>
                                        <div>{{ formatSize(file.size) }}</div>

                                        <Badge value="Pending" severity="warn" />

                                        <Button icon="pi pi-times" @click="onRemoveEvidenceFile(file, removeFileCallback, index)" variant="outlined" rounded severity="danger" />
                                    </div>
                                </div>
                            </template>

                            <template #empty>
                                <div class="flex flex-col items-center justify-center">
                                    <i class="pi pi-cloud-upload !border-2 !rounded-full !p-8 !text-4xl !text-muted-color" />
                                    <p class="mt-4 mb-0">Drag and drop photos here</p>
                                </div>
                            </template>
                        </FileUpload>

                        <ProgressBar :value="evidenceTotalSizePercent" :showValue="false" class="w-full h-1 mt-2" />
                    </div>

                    <div class="flex justify-end mt-4">
                        <Button type="button" label="Cancel" severity="secondary" @click="goBack" />
                        <Button type="submit" label="Next" severity="primary" class="ms-2" />
                    </div>
                </Form>
            </template>
        </Card>
    </div>
</template>
