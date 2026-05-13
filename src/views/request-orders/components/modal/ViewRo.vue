<script lang="ts" src="./ViewRo.script.ts"></script>

<template>
    <ProModal
        :modelValue="localVisible"
        @update:modelValue="(val: boolean) => { localVisible = val; if (!val) handleClose(); }"
        title="Request Order Details"
        size="full"
        class="!z-[1000]"
    >
        <div v-if="localOrder">
            <!-- Header Info -->
            <div class="mb-6">
                <h6 class="text-body-bold text-text-heading mb-4">
                    Request Order:
                    <span class="text-text-subtitle font-normal ml-1">{{ localOrder.roNumber }}</span>
                </h6>

                <div class="grid grid-cols-2 gap-4 bg-surface-gray-bg rounded-container p-4 border border-border-border">
                    <div>
                        <p class="text-body-sm text-text-subtitle mb-1">Status</p>
                        <p class="text-body-sm-bold text-text-heading">{{ localOrder.status }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm text-text-subtitle mb-1">Requested At</p>
                        <p class="text-body-sm-bold text-text-heading">{{ localOrder.requestedAt }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm text-text-subtitle mb-1">Requested By</p>
                        <p class="text-body-sm-bold text-text-heading">{{ localOrder.requestedBy }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm text-text-subtitle mb-1">Budget Type</p>
                        <p class="text-body-sm-bold text-text-heading">{{ localOrder.budgetType }}</p>
                    </div>
                    <div>
                        <p class="text-body-sm text-text-subtitle mb-1">RO Date</p>
                        <p class="text-body-sm-bold text-text-heading">{{ localOrder.roDate }}</p>
                    </div>
                </div>
            </div>

            <!-- Requested Items Table -->
            <h3 class="text-body-bold text-text-heading mb-3">Requested Items</h3>
            <div class="hidden lg:block mb-6">
                <ProTable
                    :columns="[
                        { key: 'code', label: 'Item Code' },
                        { key: 'description', label: 'Description' },
                        { key: 'uom', label: 'UOM' },
                        { key: 'originalBudgetQty', label: 'Order Qty' },
                        { key: 'requestedQty', label: 'Requested Qty' },
                        { key: 'exceededQty', label: 'Exceeded Qty' },
                        { key: 'exceededPercent', label: 'Exceeded %' },
                        { key: 'deliveryDate', label: 'Delivery Date' },
                        { key: 'note', label: 'Note' },
                    ]"
                >
                    <tr
                        v-for="(item, idx) in localOrder.items"
                        :key="idx"
                        :class="item.exceedBudget ? 'bg-surface-error/30' : ''"
                    >
                        <td class="px-3 py-2 text-body-sm text-text-body">{{ item.code }}</td>
                        <td class="px-3 py-2 text-body-sm text-text-body">{{ item.description }}</td>
                        <td class="px-3 py-2 text-body-sm text-text-body">{{ item.uom }}</td>
                        <td class="px-3 py-2 text-body-sm text-text-body">{{ String(item.originalBudgetQty ?? '-') }}</td>
                        <td class="px-3 py-2 text-body-sm text-text-body">
                            <span v-if="item.requestedQty" class="text-body-sm-bold text-text-heading">{{ item.requestedQty?.toFixed(2) }}</span>
                            <span v-else class="text-text-disabled">-</span>
                        </td>
                        <td class="px-3 py-2 text-body-sm text-text-body">
                            <span v-if="item.exceedBudget" class="text-body-sm-bold text-text-error">+{{ item.exceededQty?.toFixed(2) }}</span>
                            <span v-else class="text-text-disabled">-</span>
                        </td>
                        <td class="px-3 py-2 text-body-sm text-text-body">
                            <span v-if="item.exceedBudget" class="text-body-sm-bold text-text-error">{{ item.exceededPercent?.toFixed(2) }}%</span>
                            <span v-else class="text-text-disabled">-</span>
                        </td>
                        <td class="px-3 py-2 text-body-sm text-text-body">{{ item.deliveryDate ?? '-' }}</td>
                        <td class="px-3 py-2 text-body-sm text-text-body">{{ item.note ?? '-' }}</td>
                    </tr>
                </ProTable>
            </div>

            <!-- Mobile View -->
            <div class="block lg:hidden mb-6">
                <template v-if="localOrder.items && localOrder.items.length > 0">
                    <div class="grid grid-cols-1 gap-4">
                        <ProCard v-for="(item, idx) in localOrder.items" :key="idx" class="shadow-sm border border-gray-100" :class="item.exceedBudget ? 'bg-surface-error/10' : ''">
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex items-start gap-2">
                                    <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ idx + 1 }}</span>
                                    <div class="flex flex-col gap-0.5">
                                        <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Item Code</span>
                                        <span class="font-semibold text-text-heading leading-tight">{{ item.code }}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="grid gap-2 mb-2">
                                <div class="flex flex-col gap-1">
                                    <span class="text-xs font-medium text-gray-500">Description</span>
                                    <span class="text-sm font-medium">{{ item.description }}</span>
                                </div>
                                <div class="grid grid-cols-2 gap-4 mt-2 border-t border-gray-100 pt-3">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs font-medium text-gray-500">UOM</span>
                                        <span class="text-sm">{{ item.uom || '-' }}</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs font-medium text-gray-500">Order Qty</span>
                                        <span class="text-sm font-medium">{{ String(item.originalBudgetQty ?? '-') }}</span>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 mt-2 border-t border-gray-100 pt-3">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs font-medium text-gray-500">Requested Qty</span>
                                        <span v-if="item.requestedQty" class="text-sm font-semibold">{{ item.requestedQty?.toFixed(2) }}</span>
                                        <span v-else class="text-text-disabled">-</span>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs font-medium text-gray-500">Delivery Date</span>
                                        <span class="text-sm">{{ item.deliveryDate ?? '-' }}</span>
                                    </div>
                                </div>

                                <div v-if="item.exceedBudget" class="mt-2 p-2 bg-surface-error/20 rounded border border-surface-error/30">
                                    <div class="grid grid-cols-2 gap-2">
                                        <div class="flex flex-col gap-1">
                                            <span class="text-[10px] font-medium text-text-error uppercase tracking-wider">Exceeded Qty</span>
                                            <span class="text-sm font-bold text-text-error">+{{ item.exceededQty?.toFixed(2) }}</span>
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <span class="text-[10px] font-medium text-text-error uppercase tracking-wider">Exceeded %</span>
                                            <span class="text-sm font-bold text-text-error">{{ item.exceededPercent?.toFixed(2) }}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="item.note" class="flex flex-col gap-1 mt-2 border-t border-gray-100 pt-3">
                                    <span class="text-xs font-medium text-gray-500">Note</span>
                                    <span class="text-sm italic">{{ item.note }}</span>
                                </div>
                            </div>
                        </ProCard>
                    </div>
                </template>
                <div v-else class="flex flex-col items-center justify-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                    <span class="text-sm text-gray-500">No items requested.</span>
                </div>
            </div>

            <!-- Overall Remark -->
            <div v-if="localOrder.remark" class="mt-6 mb-4 p-4 bg-surface-gray-bg border border-border-border rounded-container">
                <h4 class="text-body-sm-bold text-text-heading mb-2">Remark</h4>
                <p class="text-body-sm text-text-body whitespace-pre-wrap">{{ localOrder.remark }}</p>
            </div>

            <!-- Attachments -->
            <div class="mt-4">
                <div v-if="existingAttachments.length > 0" class="mb-4">
                    <h4 class="text-body-sm-bold text-text-heading mb-3">Attachments</h4>
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
                                class="w-7 h-7 flex items-center justify-center rounded-md text-brand-primary hover:bg-surface-gray-bg/80 transition-colors"
                                @click="previewAttachment(file)"
                                title="Preview Attachment"
                            >
                                <PhEye :size="14" />
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="text-body-sm text-text-disabled italic">No attachments available.</div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3">
                <template v-if="isPurchasingRole && localOrder?.status === 'Submitted'">
                    <ProButton variant="danger" @click="handleReject">
                        <template #iconLeft><PhX :size="16" /></template>
                        Reject Request
                    </ProButton>
                    <ProButton variant="primary" @click="handleApprove">
                        <template #iconLeft><PhCheck :size="16" /></template>
                        Approve Request
                    </ProButton>
                </template>
                <template v-else>
                    <ProButton variant="secondary" @click="handleClose">
                        <template #iconLeft><PhX :size="16" /></template>
                        Close
                    </ProButton>
                </template>
            </div>
        </template>
    </ProModal>
</template>
