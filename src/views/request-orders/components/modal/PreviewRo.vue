<script lang="ts" src="./PreviewRo.script.ts"></script>

<template>
    <Dialog v-model:visible="localVisible" modal header="Summary Order" class="w-11/12 md:w-5/6" @update:visible="handleClose">
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
                    <span class="ml-2 font-medium">{{ summaryData.budgetType }}</span>
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
                    <span class="text-gray-600 dark:text-gray-400">Delivery Date:</span>
                    <span class="ml-2 font-medium">{{ summaryData.globalDeliveryDate }}</span>
                </div>
                <!-- <div>
                    <span class="text-gray-600 dark:text-gray-400">RO Number:</span>
                    <span class="ml-2 font-medium">{{ summaryData.roNumber }}</span>
                </div> -->
                <div>
                    <span class="text-gray-600 dark:text-gray-400">Requested By:</span>
                    <span class="ml-2 font-medium">{{ summaryData.requestedBy }}</span>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="overflow-x-auto mb-4">
            <DataTable :value="summaryData.items" class="text-sm" scrollable scrollHeight="400px">
                <Column field="no" header="No" style="min-width: 50px; width: 50px">
                    <template #body="{ index }">
                        {{ index + 1 }}
                    </template>
                </Column>

                <Column field="itemType" header="Item Type" style="min-width: 100px">
                    <template #body="{ data }">
                        <span>{{ data.itemType }}</span>
                    </template>
                </Column>

                <Column field="itemCode" header="Item Code" style="min-width: 120px">
                    <template #body="{ data }">
                        <span class="font-medium">{{ data.itemCode }}</span>
                    </template>
                </Column>

                <Column field="description" header="Description" style="min-width: 200px">
                    <template #body="{ data }">
                        <div>
                            <div class="font-medium">{{ data.description }}</div>
                            <div v-if="data.notes" class="text-xs text-gray-500 mt-1">Note: {{ data.notes }}</div>
                        </div>
                    </template>
                </Column>
                <Column field="location" header="Location" style="min-width: 150px">
                    <template #body="{ data }">
                        <div class="text-xs">{{ data.location }}</div>
                    </template>
                </Column>
                <Column field="uom" header="UOM" style="min-width: 70px; text-align: center">
                    <template #body="{ data }">
                        {{ data.uom }}
                    </template>
                </Column>

                <Column field="qty" header="QTY" style="min-width: 80px; text-align: center">
                    <template #body="{ data }">
                        {{ data.qty }}
                    </template>
                </Column>

                <Column field="qtyRequested" header="QtyReq" style="min-width: 80px; text-align: center">
                    <template #body="{ data }">
                        {{ data.qtyRequested || '' }}
                    </template>
                </Column>

                <Column field="qtyOrdered" header="QtyOrd" style="min-width: 80px; text-align: center">
                    <template #body="{ data }">
                        {{ data.qtyOrdered || '' }}
                    </template>
                </Column>

                <Column field="qtyDelivered" header="QtyDelivered" style="min-width: 100px; text-align: center">
                    <template #body="{ data }">
                        {{ data.qtyDelivered || '' }}
                    </template>
                </Column>

                <Column field="price" header="APPLY" style="min-width: 120px; text-align: right; display: none">
                    <template #body="{ data }">
                        <div>
                            <div>{{ formatCurrency(data.price) }}</div>
                            <div v-if="data.remark" class="text-xs text-gray-500 mt-1">Remark: {{ data.remark }}</div>
                        </div>
                    </template>
                </Column>

                <Column field="deliveryDate" header="Del. Date" style="min-width: 110px; display: none">
                    <template #body="{ data }">
                        <span :class="{ 'font-bold text-red-600': isOverdue(data.deliveryDate) }">
                            {{ formatDate(data.deliveryDate) }}
                        </span>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Overall Remark -->
        <div v-if="summaryData.overallRemark" class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
            <div class="text-sm">
                <span class="font-semibold text-gray-700 dark:text-gray-300">Overall Remark:</span>
                <p class="mt-1 text-gray-600 dark:text-gray-400">{{ summaryData.overallRemark }}</p>
            </div>
        </div>

        <!-- Attachments Info -->
        <div v-if="summaryData.attachmentsCount > 0" class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <i class="pi pi-paperclip mr-2"></i>
            <span>{{ summaryData.attachmentsCount }} {{ summaryData.attachmentsCount === 1 ? 'attachment' : 'attachments' }}</span>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" severity="secondary" outlined icon="pi pi-times" @click="handleClose" />
                <Button label="Submit" severity="success" outlined icon="pi pi-check" @click="handleSubmit" :loading="isSubmitting" />
            </div>
        </template>
    </Dialog>
</template>
