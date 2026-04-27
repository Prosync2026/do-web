<script lang="ts" src="./PreviewRo.script.ts"></script>

<template>
    <ProModal :modelValue="localVisible" @update:modelValue="(val: boolean) => { localVisible = val; if (!val) $emit('update:visible', false); }" title="Summary Order" size="full" class="!z-[110]">
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
        <div class="overflow-x-auto mb-4">
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
