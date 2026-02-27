<script lang="ts" src="./EditRo.script.ts"></script>

<template>
    <Dialog v-model:visible="localVisible" :modal="true" header="Edit Request Order" :style="{ width: '90vw', maxWidth: '1200px' }">
        <div v-if="order">
            <form @submit.prevent="handleSave">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-semibold mb-2">RO Number</label>
                        <InputText v-model="editForm.roNumber" class="w-full" disabled />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Requested By</label>
                        <InputText v-model="editForm.requestedBy" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">RO Date</label>
                        <Calendar v-model="editForm.roDate" dateFormat="yy-mm-dd" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Total Amount</label>
                        <InputNumber v-model="editForm.totalAmount" mode="decimal" :minFractionDigits="2" class="w-full" disabled />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Budget Type</label>
                        <Dropdown v-model="editForm.budgetType" :options="budgetTypeOptions" optionLabel="label" optionValue="value" class="w-full" disabled />
                    </div>
                </div>

                <h3 class="font-semibold mb-3">Requested Items</h3>
                <DataTable :value="editForm.items" class="w-full">
                    <Column field="code" header="Item Code">
                        <template #body="slotProps">
                            <InputText v-model="slotProps.data.code" class="w-full" disabled />
                        </template>
                    </Column>
                    <Column field="description" header="Description">
                        <template #body="slotProps">
                            <InputText v-model="slotProps.data.description" class="w-full" disabled />
                        </template>
                    </Column>
                    <Column field="uom" header="UOM">
                        <template #body="slotProps">
                            <InputText v-model="slotProps.data.uom" class="w-full" />
                        </template>
                    </Column>
                    <Column field="qty" header="Quantity">
                        <template #body="slotProps">
                            <InputNumber v-model="slotProps.data.qty" class="w-full" />
                        </template>
                    </Column>
                    <Column field="deliveryDate" header="Delivery Date">
                        <template #body="slotProps">
                            <Calendar v-model="slotProps.data.deliveryDate" dateFormat="yy-mm-dd" class="w-full" />
                        </template>
                    </Column>
                    <Column field="notes" header="Notes">
                        <template #body="slotProps">
                            <InputText v-model="slotProps.data.notes" class="w-full" />
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body="slotProps">
                            <Button icon="pi pi-trash" severity="danger" text @click="removeItem(slotProps.index)" />
                        </template>
                    </Column>
                </DataTable>
                <Button :label="editForm.budgetType === 'Budgeted' ? 'Add from Budget' : 'Add from Stock'" icon="pi pi-plus" outlined @click="addItem" class="mb-4 mt-4" />

                <!-- Add item modals: same as Create RO - budgeted vs unbudgeted -->
                <CreateROModal v-model:visible="showBulkItemModal" :projectId="projectId" :version="0" @items-selected="handleBudgetItemsSelected" />
                <CreateStockItem v-model:visible="showStockItemModal" @items-selected="handleStockItemsSelected" />

                <!-- Overall Attachments -->
                <div class="mt-4">
                    <label class="block text-sm text-gray-600 mb-2">Attachments</label>

                    <!-- Show existing attachments -->
                    <div v-if="existingAttachments.length > 0" class="mb-4">
                        <h4 class="text-sm font-semibold mb-2">Existing Attachments</h4>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="(file, index) in existingAttachments" :key="`existing-${index}`" class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                                <i class="pi pi-file"></i>
                                <span class="text-sm">{{ file.filename }}</span>
                                <span v-if="file.size" class="text-xs text-gray-500">({{ formatSize(file.size) }})</span>
                                <Button icon="pi pi-eye" text rounded severity="info" @click="previewAttachment(file)" />
                                <Button icon="pi pi-times" text rounded severity="danger" @click="removeExistingAttachment(index)" />
                            </div>
                        </div>
                    </div>

                    <!-- FileUpload for new attachments -->
                    <FileUpload name="attachments" :multiple="true" accept="image/*" :maxFileSize="1000000" :auto="false" @select="onSelectedFiles" :showUploadButton="false" :showCancelButton="false">
                        <template #header="{ chooseCallback, clearCallback, files }">
                            <div class="flex gap-2">
                                <Button @click="chooseCallback()" icon="pi pi-images" label="Choose Files" outlined />
                                <Button @click="clearCallback" icon="pi pi-times" label="Clear" outlined severity="danger" :disabled="!files || files.length === 0" />
                            </div>
                        </template>

                        <template #content="{ files, removeFileCallback }">
                            <div v-if="files.length > 0" class="mt-4">
                                <h4 class="text-sm font-semibold mb-2">New Attachments to Upload</h4>
                                <div class="flex flex-wrap gap-2">
                                    <div v-for="(file, index) in files" :key="`new-${index}`" class="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                                        <i class="pi pi-file"></i>
                                        <span class="text-sm">{{ file.name }}</span>
                                        <span class="text-xs text-gray-500">({{ formatSize(file.size) }})</span>
                                        <Button icon="pi pi-times" text rounded severity="danger" @click="removeFileCallback(index)" />
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #empty>
                            <div class="flex items-center justify-center flex-col p-4">
                                <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-2" />
                                <p class="text-sm text-gray-500">Drag and drop files here or click "Choose Files"</p>
                            </div>
                        </template>
                    </FileUpload>
                </div>

                <!-- Overall Remark -->
                <div class="mt-4">
                    <label class="block text-sm text-gray-600 mb-1">Remark</label>
                    <Textarea v-model="editForm.remark" rows="3" class="w-full" placeholder="Add any additional remarks or notes..." />
                </div>
            </form>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" severity="secondary" outlined icon="pi pi-times" @click="handleCancel" />
                <Button label="Save Changes" severity="success" icon="pi pi-check" @click="handleSave" :disabled="loading" :loading="loading" />
            </div>
        </template>
    </Dialog>
</template>
