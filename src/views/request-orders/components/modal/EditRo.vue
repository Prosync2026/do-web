<script lang="ts" src="./EditRo.script.ts"></script>

<template>
    <ProModal
        :modelValue="localVisible"
        @update:modelValue="(val: boolean) => { localVisible = val; if (!val) handleCancel(); }"
        title="Edit Request Order"
        size="full"
        class="!z-[1000]"
    >
        <div v-if="order">
            <form @submit.prevent="handleSave">
                <!-- Header Fields -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">RO Number</label>
                        <ProInput
                            v-model="editForm.roNumber"
                            class="w-full"
                            disabled
                        />
                    </div>
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">Requested By</label>
                        <ProInput
                            v-model="editForm.requestedBy"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">RO Date</label>
                        <ProDatePicker :modelValue="formatDateToAPI(editForm.roDate)" @update:modelValue="editForm.roDate = ($event ? new Date($event) : null)" class="w-full" appendTo="body" />
                    </div>
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">Total Amount</label>
                        <ProInput
                            :modelValue="String(editForm.totalAmount)"
                            class="w-full"
                            disabled
                        />
                    </div>
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">Budget Type</label>
                        <ProInput
                            :modelValue="editForm.budgetType"
                            class="w-full"
                            disabled
                        />
                    </div>
                </div>

                <!-- Items Table -->
                <h3 class="text-body-bold text-text-heading mb-3">Requested Items</h3>
                <div class="hidden lg:block mb-4">
                    <ProTable
                        :columns="[
                            { key: 'code', label: 'Item Code' },
                            { key: 'description', label: 'Description' },
                            { key: 'uom', label: 'UOM' },
                            { key: 'qty', label: 'Quantity', width: '180px' },
                            { key: 'deliveryDate', label: 'Delivery Date' },
                            { key: 'notes', label: 'Notes' },
                            { key: 'actions', label: 'Actions' },
                        ]"
                    >
                        <tr v-for="(item, index) in editForm.items" :key="index">
                            <td class="px-3 py-2">
                                <ProInput
                                    v-model="item.code"
                                    class="w-full !text-body-sm"
                                    disabled
                                />
                            </td>
                            <td class="px-3 py-2">
                                <ProInput
                                    v-model="item.description"
                                    class="w-full !text-body-sm"
                                    disabled
                                />
                            </td>
                            <td class="px-3 py-2">
                                <ProInput
                                    v-model="item.uom"
                                    class="w-full !text-body-sm"
                                />
                            </td>
                            <td class="px-3 py-2">
                                <div class="min-w-[140px]">
                                    <InputNumber v-model="item.qty" :min="0" :maxFractionDigits="4" class="w-full" />
                                </div>
                            </td>
                            <td class="px-3 py-2">
                                <ProDatePicker :modelValue="formatDateToAPI(item.deliveryDate)" @update:modelValue="item.deliveryDate = ($event ? new Date($event) : null)" class="w-full" appendTo="body" />
                            </td>
                            <td class="px-3 py-2">
                                <ProInput
                                    v-model="item.notes"
                                    class="w-full !text-body-sm"
                                />
                            </td>
                            <td class="px-3 py-2">
                                <button
                                    type="button"
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-text-error hover:bg-surface-error/10 transition-colors"
                                    @click="removeItem(index)"
                                >
                                    <PhTrash :size="16" />
                                </button>
                            </td>
                        </tr>
                    </ProTable>
                </div>

                <!-- Mobile View -->
                <div class="block lg:hidden mb-4">
                    <template v-if="editForm.items && editForm.items.length > 0">
                        <div class="grid grid-cols-1 gap-4">
                            <ProCard v-for="(item, index) in editForm.items" :key="index" class="shadow-sm border border-gray-100 relative overflow-visible">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-start gap-2">
                                        <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ index + 1 }}</span>
                                        <div class="flex flex-col gap-0.5 mt-1">
                                            <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Item Code</span>
                                            <span class="font-semibold text-text-heading leading-tight">{{ item.code }}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        class="w-8 h-8 flex items-center justify-center rounded-md text-text-error bg-surface-error/10 hover:bg-surface-error/20 transition-colors flex-shrink-0"
                                        @click="removeItem(index)"
                                        title="Remove Item"
                                    >
                                        <PhTrash :size="16" />
                                    </button>
                                </div>

                                <div class="grid gap-3">
                                    <div>
                                        <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
                                        <ProInput v-model="item.description" class="w-full !text-body-sm" disabled />
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">UOM</label>
                                            <ProInput v-model="item.uom" class="w-full !text-body-sm" />
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
                                            <InputNumber v-model="item.qty" :min="0" :maxFractionDigits="4" class="w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Delivery Date</label>
                                        <ProDatePicker :modelValue="formatDateToAPI(item.deliveryDate)" @update:modelValue="item.deliveryDate = ($event ? new Date($event) : null)" class="w-full" appendTo="body" />
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</label>
                                        <ProInput v-model="item.notes" class="w-full !text-body-sm" />
                                    </div>
                                </div>
                            </ProCard>
                        </div>
                    </template>
                    <div v-else class="flex flex-col items-center justify-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                        <span class="text-sm text-gray-500">No items added yet.</span>
                    </div>
                </div>

                <ProButton
                    variant="plain"
                    type="button"
                    class="mb-6 mt-2"
                    @click="addItem"
                >
                    <template #iconLeft><PhPlus :size="16" /></template>
                    {{ editForm.budgetType === 'Budgeted' ? 'Add from Budget' : 'Add from Stock' }}
                </ProButton>

                <!-- Sub-modals -->
                <CreateROModal v-model:visible="showBulkItemModal" :projectId="projectId" :version="0" @items-selected="handleBudgetItemsSelected" />
                <CreateStockItem v-model:visible="showStockItemModal" @items-selected="handleStockItemsSelected" />

                <!-- Attachments -->
                <div class="mt-4">
                    <label class="block text-body-sm text-text-subtitle mb-2">Attachments</label>

                    <!-- Existing Attachments -->
                    <div v-if="existingAttachments.length > 0" class="mb-4">
                        <h4 class="text-body-sm-bold text-text-heading mb-2">Existing Attachments</h4>
                        <div class="flex flex-wrap gap-2">
                            <div
                                v-for="(file, index) in existingAttachments"
                                :key="`existing-${index}`"
                                class="flex items-center gap-2 px-3 py-2 bg-surface-gray-bg border border-border-border rounded-button"
                            >
                                <PhFile :size="16" class="text-icon-default" />
                                <span class="text-body-sm text-text-body">{{ file.filename }}</span>
                                <span v-if="file.size" class="text-caption text-text-disabled">({{ formatSize(file.size) }})</span>
                                <button
                                    type="button"
                                    class="w-7 h-7 flex items-center justify-center rounded-md text-brand-primary hover:bg-surface-gray-bg/80 transition-colors"
                                    @click="previewAttachment(file)"
                                    title="Preview"
                                >
                                    <PhEye :size="14" />
                                </button>
                                <button
                                    type="button"
                                    class="w-7 h-7 flex items-center justify-center rounded-md text-text-error hover:bg-surface-error/10 transition-colors"
                                    @click="removeExistingAttachment(index)"
                                    title="Remove"
                                >
                                    <PhX :size="14" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- New File Upload -->
                    <div class="mt-2">
                        <ProUploadFile v-model="newAttachments" multiple accept="image/*" :maxSize="1" />
                    </div>
                </div>

                <!-- Overall Remark -->
                <div class="mt-4">
                    <label class="block text-body-sm text-text-subtitle mb-1">Remark</label>
                    <ProTextarea
                        v-model="editForm.remark"
                        rows="3"
                        class="w-full"
                        placeholder="Add any additional remarks or notes..."
                    />
                </div>
            </form>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3">
                <ProButton variant="secondary" type="button" @click="handleCancel">
                    <template #iconLeft><PhX :size="16" /></template>
                    Cancel
                </ProButton>
                <ProButton variant="primary" type="button" @click="handleSave" :disabled="loading" :loading="loading">
                    <template #iconLeft><PhCheck :size="16" /></template>
                    Save Changes
                </ProButton>
            </div>
        </template>
    </ProModal>
</template>
