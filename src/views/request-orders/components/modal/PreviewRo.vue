<script lang="ts" src="./PreviewRo.script.ts"></script>

<template>
    <ProModal :modelValue="localVisible" @update:modelValue="(val: boolean) => { localVisible = val; if (!val) $emit('update:visible', false); }" title="Summary Order" size="full" class="!z-[1000]">
        <!-- Summary Section -->
        <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 shadow-sm">
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <span class="text-gray-600 dark:text-gray-400">Total Items:</span>
                    <span class="ml-2 font-medium">{{ summaryData.totalItems }}</span>
                </div>
                <div style="display: none">
                    <span class="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span class="ml-2 font-medium">{{ formatCurrency(summaryData.totalAmount) }}</span>
                </div>
                <div>
                    <span class="text-gray-600 dark:text-gray-400">Budget Type:</span>
                    <span class="ml-2 font-medium">
                        {{ summaryData.budgetType }}
                        <span v-if="summaryData.subcon" class="ml-1 text-sm text-gray-500"> (Subcon: {{ summaryData.subcon }}) </span>
                    </span>
                </div>

                <div>
                    <span class="text-gray-600 dark:text-gray-400">Project:</span>
                    <span class="ml-2 font-medium">{{ summaryData.project }}</span>
                </div>
                <div>
                    <span class="text-gray-600 dark:text-gray-400">RO Date:</span>
                    <span class="ml-2 font-medium">{{ summaryData.roDate }}</span>
                </div>

                <div>
                    <span class="text-gray-600 dark:text-gray-400">Requested By:</span>
                    <span class="ml-2 font-medium">{{ summaryData.requestedBy }}</span>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="overflow-x-auto mb-4 hidden lg:block">
            <ProTable :data="summaryData.items" :columns="columns" class="text-sm">
                <template #cell-no="{ row }">
                    {{ summaryData.items.indexOf(row) + 1 }}
                </template>
                <template #cell-itemType="{ row }">
                    {{ row.itemType }}
                </template>
                <template #cell-itemCode="{ row }">
                    <span class="font-medium">{{ row.itemCode }}</span>
                </template>
                <template #cell-description="{ row }">
                    <div>
                        <div class="font-medium">{{ row.description }}</div>
                        <div v-if="row.notes" class="text-xs text-gray-500 mt-1">Note: {{ row.notes }}</div>
                    </div>
                </template>
                <template #cell-location="{ row }">
                    <div class="text-xs">{{ row.location }}</div>
                </template>
                <template #cell-uom="{ row }">
                    {{ row.uom }}
                </template>
                <template #cell-qty="{ row }">
                    {{ row.qty }}
                </template>
                <template #cell-qtyRequested="{ row }">
                    {{ row.qtyRequested || '' }}
                </template>
                <template #cell-budgetQty="{ row }">
                    {{ row.budgetQty || '' }}
                </template>
                <template #cell-qtyOrdered="{ row }">
                    {{ row.qtyOrdered || '' }}
                </template>
                <template #cell-qtyDelivered="{ row }">
                    {{ row.qtyDelivered || '' }}
                </template>
                <template #cell-price="{ row }">
                    <div>
                        <div>{{ formatCurrency(row.price) }}</div>
                        <div v-if="row.remark" class="text-xs text-gray-500 mt-1">Remark: {{ row.remark }}</div>
                    </div>
                </template>
                <template #cell-deliveryDate="{ row }">
                    {{ formatDate(row.deliveryDate) }}
                </template>
            </ProTable>
        </div>

        <!-- Mobile View -->
        <div class="block lg:hidden mb-4">
            <div class="grid grid-cols-1 gap-4">
                <ProCard v-for="(row, index) in summaryData.items" :key="index" class="shadow-sm border border-gray-200">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-start gap-2">
                            <span class="flex-shrink-0 w-6 h-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">{{ index + 1 }}</span>
                            <div class="flex flex-col gap-0.5 mt-0.5">
                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">Item Code</span>
                                <span class="font-semibold text-text-heading leading-tight">{{ row.itemCode }}</span>
                            </div>
                        </div>
                        <ProTag :variant="row.itemType === 'Materials' ? 'info' : row.itemType === 'Labour' ? 'warning' : 'success'">
                            {{ row.itemType || 'N/A' }}
                        </ProTag>
                    </div>

                    <div class="grid gap-3 mb-2">
                        <div class="flex flex-col gap-1">
                            <span class="text-xs font-medium text-gray-500">Description</span>
                            <span class="text-sm font-medium text-text-body">{{ row.description }}</span>
                            <div v-if="row.notes" class="mt-1 p-1.5 bg-brand-primary/5 border border-brand-primary/20 rounded-md text-xs text-brand-primary italic">
                                Note: {{ row.notes }}
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <span class="text-xs font-medium text-gray-500">Location</span>
                                <span class="text-sm">{{ row.location || '-' }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-xs font-medium text-gray-500">UOM</span>
                                <span class="text-sm">{{ row.uom || '-' }}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1">
                                <span class="text-xs font-medium text-gray-500">Qty / Requested</span>
                                <span class="text-sm font-semibold">{{ row.qty || '0' }} / {{ row.qtyRequested || '-' }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-xs font-medium text-gray-500">Delivery Date</span>
                                <span class="text-sm">{{ formatDate(row.deliveryDate) }}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-2 py-2 border-y border-gray-100">
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Budget</span>
                                <span class="text-sm">{{ row.budgetQty || '-' }}</span>
                            </div>
                            <div class="flex flex-col gap-1 border-l border-gray-100 pl-2">
                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Ordered</span>
                                <span class="text-sm">{{ row.qtyOrdered || '-' }}</span>
                            </div>
                            <div class="flex flex-col gap-1 border-l border-gray-100 pl-2">
                                <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Delivered</span>
                                <span class="text-sm">{{ row.qtyDelivered || '-' }}</span>
                            </div>
                        </div>

                        <div class="flex flex-col gap-1 pt-1">
                            <span class="text-xs font-medium text-gray-500">Price</span>
                            <span class="text-sm font-semibold text-text-heading">{{ formatCurrency(row.price || 0) }}</span>
                            <span v-if="row.remark" class="text-xs text-gray-500 italic mt-0.5">Remark: {{ row.remark }}</span>
                        </div>
                    </div>
                </ProCard>
            </div>
        </div>

        <!-- Overall Remark -->
        <div v-if="summaryData.overallRemark" class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
            <div class="text-sm">
                <span class="font-semibold text-gray-700 dark:text-gray-300">Overall Remark:</span>
                <p class="mt-1 text-gray-600 dark:text-gray-400">{{ summaryData.overallRemark }}</p>
            </div>
        </div>

        <!-- Reason -->
        <div v-if="summaryData.reason" class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
            <div class="text-sm">
                <span class="font-semibold text-gray-700 dark:text-gray-300">Reason:</span>
                <p class="mt-1 text-gray-600 dark:text-gray-400">{{ summaryData.reason }}</p>
            </div>
        </div>

        <!-- Attachments Info -->
        <div v-if="summaryData.attachmentsCount > 0" class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <PhPaperclip :size="18" class="mr-2"  />
            <span>{{ summaryData.attachmentsCount }} {{ summaryData.attachmentsCount === 1 ? 'attachment' : 'attachments' }}</span>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <ProButton variant="secondary" @click="handleClose" class="mr-2">Cancel</ProButton>
                <ProButton variant="primary" @click="handleSubmit" :loading="isSubmitting">Submit</ProButton>
            </div>
        </template>
    </ProModal>
</template>
