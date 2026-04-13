<script src="./CreateBCR.script.ts"></script>

<template>
    <Motion :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -20 }" :transition="{ duration: 0.6 }">
        <ProCard padding="lg">
            <!-- Header Information -->
            <ProCard title="Header Information" padding="md" class="mb-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <ProInput v-model="requestDate" label="Date Requested" type="text" disabled />
                    </div>
                    <div>
                        <ProInput v-model="requestBy" label="Requested By" type="text" disabled />
                    </div>
                    <div>
                        <ProInput v-model="department" label="Department" type="text" disabled />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1"> Reason for Request <span class="text-red-600 font-bold">*</span> </label>

                        <ProSelect v-model="selectedReason" :options="reasonOptions" placeholder="Select Reason" class="w-full" />

                        <ProBanner v-if="showValidation && !selectedReason" variant="error" title="Reason for request is required" class="mt-3" />
                    </div>
                </div>

                <div class="mt-4">
                    <ProInput v-model="remarks" label="Remarks" type="text" />
                </div>
            </ProCard>

            <!-- Materials Section -->
            <label class="block text-sm text-gray-600 mb-1">Materials Section</label>

            <ProCard title="Materials" padding="md" class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex gap-2">
                        <ProButton variant="primary" @click="openMeterial">＋ Add from Budget List</ProButton>
                        <ProButton variant="secondary" @click="openSingleBudgetItem">＋ Add Manually Budget Item</ProButton>
                    </div>
                </div>

                <div v-if="items.length === 0" class="flex justify-center items-center py-10 text-gray-500">
                    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
                        <ProEmpty title="No Materials" description="Add items from the budget list or manually." />
                        <ProBanner v-if="showValidation && items.length === 0" variant="error" title="Please add at least one item." class="mt-2" />
                    </Motion>
                </div>

                <div v-else class="overflow-x-auto">
                    <Motion :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 0.8 }">
                        <DataTable :value="items" :paginator="items?.length > 0" :rows="10" :rowsPerPageOptions="[10]" resizableColumns columnResizeMode="expand" scrollable scrollHeight="600px" tableStyle="min-width: 140rem" class="overflow-hidden">
                            <!-- Item Code -->
                            <Column field="itemCode" header="Item Code" style="min-width: 14rem">
                                <template #body="slotProps">
                                    <ProSelect
                                        v-model="slotProps.data.itemCode"
                                        :options="budgetItems.map((b) => ({ label: b.label, value: b.value }))"
                                        placeholder="Select item..."
                                        class="w-full"
                                        @update:modelValue="fillItemDetails(slotProps.data)"
                                    />
                                </template>
                            </Column>

                            <!-- Description -->
                            <Column field="description" header="Description" style="min-width: 22rem">
                                <template #body="slotProps">
                                    <ProInput v-model="slotProps.data.description" disabled />
                                </template>
                            </Column>

                            <!-- Units -->
                            <Column field="uom" header="Units" style="min-width: 8rem">
                                <template #body="slotProps">
                                    <ProInput v-model="slotProps.data.uom" disabled />
                                </template>
                            </Column>

                            <!-- Unit Price -->
                            <Column field="unitPrice" header="Unit Price" style="min-width: 10rem">
                                <template #body="slotProps">
                                    <ProInput type="number" v-model.number="slotProps.data.unitPrice" />
                                </template>
                            </Column>

                            <!-- New Order -->
                            <Column field="newOrder" header="Request Qty" style="min-width: 10rem">
                                <template #body="slotProps">
                                    <ProInput type="number" v-model.number="slotProps.data.statistics.totalRequestedQty" />
                                    <ProBanner v-if="showValidation && slotProps.data.statistics.totalRequestedQty <= 0" variant="error" title="Requested Qty must be greater than 0" class="mt-1" />
                                </template>
                            </Column>

                            <!-- Exceeded Qty -->
                            <Column field="exceedQty" header="Exceeded Qty" style="min-width: 12rem">
                                <template #body="slotProps">
                                    <span
                                        :class="{
                                            'text-red-600 font-bold': calcExceedQty(slotProps.data) > 0,
                                            'text-green-600': calcExceedQty(slotProps.data) < 0
                                        }"
                                    >
                                        {{ calcExceedQty(slotProps.data) }}
                                    </span>
                                </template>
                            </Column>

                            <!-- Estimated Exceed -->
                            <Column field="estimatedExceed" header="Estimated $ Exceed" style="min-width: 14rem">
                                <template #body="slotProps">
                                    <span
                                        :class="{
                                            'text-red-600 font-bold': calcExceedQty(slotProps.data) > 0,
                                            'text-green-600': calcExceedQty(slotProps.data) < 0
                                        }"
                                    >
                                        {{ calcEstimatedExceed(slotProps.data).toFixed(2) }}
                                    </span>
                                </template>
                            </Column>

                            <!-- Actions -->
                            <Column header="Actions" style="min-width: 8rem">
                                <template #body="slotProps">
                                    <ProButton variant="danger" size="sm" @click="items.splice(items.indexOf(slotProps.data), 1)">Delete</ProButton>
                                </template>
                            </Column>
                        </DataTable>

                        <div class="pt-3 mt-2 text-small font-semibold flex justify-between items-center">
                            <span>{{ items.length }} {{ items.length > 1 ? 'items' : 'item' }}</span>
                            <span class="font-semibold"> Total Variance Amount: ${{ totalVarianceAmount.toFixed(2) }} </span>
                        </div>
                    </Motion>
                </div>
            </ProCard>

            <!-- Attachments -->
            <div class="mt-4">
                <label class="block text-sm text-gray-600 mb-2">Attachments</label>
                <div v-if="existingAttachments.length > 0" class="mb-4">
                    <h4 class="text-sm font-semibold mb-2">Existing Attachments</h4>
                    <div class="flex flex-wrap gap-2">
                        <div v-for="(file, index) in existingAttachments" :key="`existing-${index}`" class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                            <i class="pi pi-file"></i>
                            <span class="text-sm">{{ file.filename }}</span>
                            <ProButton variant="ghost" size="sm" @click="previewAttachment(file)"><i class="pi pi-eye"></i></ProButton>
                            <ProButton variant="danger" size="sm" @click="removeAttachment(index)">Remove</ProButton>
                        </div>
                    </div>
                </div>

                <FileUpload ref="fileupload" name="attachments" :multiple="true" accept="image/*" :maxFileSize="1000000" :auto="false" @select="onSelectedFiles" :showUploadButton="false" :showCancelButton="false">
                    <template #content>
                        <div v-if="attachments && attachments.length > 0" class="flex flex-wrap gap-4 mt-4">
                            <div v-for="(file, index) of attachments" :key="`${file.name}-${index}`" class="relative w-24 h-24">
                                <img :src="createObjectURL(file)" :alt="file.name" class="w-full h-full object-cover rounded-lg" />
                                <ProButton variant="danger" size="sm" class="absolute -top-2 -right-2 w-8 h-8" @click="attachments.splice(index, 1)">×</ProButton>
                            </div>
                        </div>
                    </template>
                    <template #empty>
                        <div class="flex items-center justify-center flex-col p-8">
                            <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-2" />
                            <p class="text-sm text-gray-500">Drag and drop image files here or click to select</p>
                        </div>
                    </template>
                </FileUpload>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end mb-6">
                <div class="flex gap-2">
                    <ProButton variant="secondary" @click="goBack">Cancel</ProButton>
                    <ProButton variant="primary" @click="submitRequest">Submit Request</ProButton>
                </div>
            </div>

            <!-- Modals -->
            <MeterialModal v-model:visible="showBulkItemModal" @bcr-items-selected="handleBulkItems" :unRequiredDelivery="true" />
            <SingleBudgetModal v-model:visible="showSingleItemModal" @items-value="handleAddItems" />

            <!-- Toast -->
            <ProToast v-model="toastState.visible" :type="toastState.type" :message="toastState.message" :autoDismiss="true" :duration="3000" />
        </ProCard>
    </Motion>
</template>
