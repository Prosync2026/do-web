<script lang="ts" src="./EditRo.script.ts"></script>

<template>
    <ProModal
        :modelValue="localVisible"
        @update:modelValue="(val: boolean) => { localVisible = val; if (!val) handleCancel(); }"
        title="Edit Request Order"
        size="full"
        class="!z-[100]"
    >
        <div v-if="order">
            <form @submit.prevent="handleSave">
                <!-- Header Fields -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">RO Number</label>
                        <input
                            v-model="editForm.roNumber"
                            class="w-full px-3 py-2 border border-border-border rounded-button bg-surface-gray-bg text-text-body text-body-sm focus:outline-none"
                            disabled
                        />
                    </div>
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">Requested By</label>
                        <input
                            v-model="editForm.requestedBy"
                            class="w-full px-3 py-2 border border-border-border rounded-button bg-surface-sub-bg text-text-body text-body-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        />
                    </div>
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">RO Date</label>
                        <Calendar v-model="editForm.roDate" dateFormat="yy-mm-dd" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">Total Amount</label>
                        <input
                            :value="editForm.totalAmount"
                            class="w-full px-3 py-2 border border-border-border rounded-button bg-surface-gray-bg text-text-body text-body-sm focus:outline-none"
                            disabled
                        />
                    </div>
                    <div>
                        <label class="block text-body-sm text-text-subtitle mb-1">Budget Type</label>
                        <input
                            :value="editForm.budgetType"
                            class="w-full px-3 py-2 border border-border-border rounded-button bg-surface-gray-bg text-text-body text-body-sm focus:outline-none"
                            disabled
                        />
                    </div>
                </div>

                <!-- Items Table -->
                <h3 class="text-body-bold text-text-heading mb-3">Requested Items</h3>
                <ProTable
                    :columns="[
                        { key: 'code', label: 'Item Code' },
                        { key: 'description', label: 'Description' },
                        { key: 'uom', label: 'UOM' },
                        { key: 'qty', label: 'Quantity' },
                        { key: 'deliveryDate', label: 'Delivery Date' },
                        { key: 'notes', label: 'Notes' },
                        { key: 'actions', label: 'Actions' },
                    ]"
                    class="mb-4"
                >
                    <tr v-for="(item, index) in editForm.items" :key="index">
                        <td class="px-3 py-2">
                            <input
                                v-model="item.code"
                                class="w-full px-2 py-1 border border-border-border rounded-button bg-surface-gray-bg text-body-sm text-text-body focus:outline-none"
                                disabled
                            />
                        </td>
                        <td class="px-3 py-2">
                            <input
                                v-model="item.description"
                                class="w-full px-2 py-1 border border-border-border rounded-button bg-surface-gray-bg text-body-sm text-text-body focus:outline-none"
                                disabled
                            />
                        </td>
                        <td class="px-3 py-2">
                            <input
                                v-model="item.uom"
                                class="w-full px-2 py-1 border border-border-border rounded-button bg-surface-sub-bg text-body-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                        </td>
                        <td class="px-3 py-2">
                            <InputNumber v-model="item.qty" class="w-full" />
                        </td>
                        <td class="px-3 py-2">
                            <Calendar v-model="item.deliveryDate" dateFormat="yy-mm-dd" class="w-full" />
                        </td>
                        <td class="px-3 py-2">
                            <input
                                v-model="item.notes"
                                class="w-full px-2 py-1 border border-border-border rounded-button bg-surface-sub-bg text-body-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
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
                    <FileUpload
                        name="attachments"
                        :multiple="true"
                        accept="image/*"
                        :maxFileSize="1000000"
                        :auto="false"
                        @select="onSelectedFiles"
                        :showUploadButton="false"
                        :showCancelButton="false"
                    >
                        <template #header="{ chooseCallback, clearCallback, files }">
                            <div class="flex gap-2">
                                <ProButton type="button" variant="plain" @click="chooseCallback()">
                                    <template #iconLeft><PhImages :size="16" /></template>
                                    Choose Files
                                </ProButton>
                                <ProButton type="button" variant="danger" @click="clearCallback" :disabled="!files || files.length === 0">
                                    <template #iconLeft><PhX :size="16" /></template>
                                    Clear
                                </ProButton>
                            </div>
                        </template>

                        <template #content="{ files, removeFileCallback }">
                            <div v-if="files.length > 0" class="mt-4">
                                <h4 class="text-body-sm-bold text-text-heading mb-2">New Attachments to Upload</h4>
                                <div class="flex flex-wrap gap-2">
                                    <div
                                        v-for="(file, index) in files"
                                        :key="`new-${index}`"
                                        class="flex items-center gap-2 px-3 py-2 bg-surface-info border border-border-info rounded-button"
                                    >
                                        <PhFile :size="16" class="text-icon-info" />
                                        <span class="text-body-sm text-text-body">{{ file.name }}</span>
                                        <span class="text-caption text-text-disabled">({{ formatSize(file.size) }})</span>
                                        <button
                                            type="button"
                                            class="w-7 h-7 flex items-center justify-center rounded-md text-text-error hover:bg-surface-error/10 transition-colors"
                                            @click="removeFileCallback(index)"
                                        >
                                            <PhX :size="14" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #empty>
                            <div class="flex items-center justify-center flex-col p-6 border-2 border-dashed border-border-border rounded-container">
                                <PhCloudArrowUp :size="40" class="text-icon-default mb-2" />
                                <p class="text-body-sm text-text-disabled">Drag and drop files here or click "Choose Files"</p>
                            </div>
                        </template>
                    </FileUpload>
                </div>

                <!-- Overall Remark -->
                <div class="mt-4">
                    <label class="block text-body-sm text-text-subtitle mb-1">Remark</label>
                    <textarea
                        v-model="editForm.remark"
                        rows="3"
                        class="w-full px-3 py-2 border border-border-border rounded-button bg-surface-sub-bg text-body-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
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
