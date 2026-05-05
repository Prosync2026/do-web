<script lang="ts" src="./CreateRequestOrders.script.ts"></script>

<template>
    <div class="p-1 space-y-1">

        <ProCard class="shadow-sm">
            <h2 class="text-lg font-semibold mb-4 text-text-heading">Request Order Details</h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Budget Type -->
                <div>
                    <label class="block text-sm font-medium text-text-body mb-2"> Budget Type <span class="text-brand-danger">*</span> </label>
                    <div class="flex flex-col gap-2">
                        <ProSelect id="budgetType" v-model="budgetType" :options="budgetOptions" placeholder="Select Budget Type" class="w-full" :class="{ 'border-brand-danger': showValidation && !budgetType }" />
                        <p v-if="showValidation && !budgetType" class="text-sm text-brand-danger flex items-center gap-1"><PhXCircle :size="18"  /> Budget Type is required</p>
                    </div>
                </div>

                <!-- RO Date -->
                <div>
                    <ProInput type="date" :modelValue="calendarValue ? formatDateToAPI(calendarValue) : formatDateToAPI(new Date())" readonly label="RO Date" required />
                    <p v-if="showValidation && !calendarValue" class="text-sm text-brand-danger mt-1 flex items-center gap-1"><PhXCircle :size="18" /> RO Date is required</p>
                </div>

                <!-- Subcon & Reason -->
                <Motion v-if="budgetType === 'Unbudgeted Item'" class="col-span-1 md:col-span-3" :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ duration: 1 }">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Subcon -->
                        <div>
                            <label class="block text-sm font-medium text-text-body mb-2">Subcon</label>
                            <div class="flex flex-col gap-2">
                                <!-- Kept autocomplete but styled wrapper -->
                                <div class="w-full relative" :class="{ 'p-invalid border-brand-danger rounded': showValidation && !selectedSubcon }">
                                    <AutoComplete v-model="selectedSubcon" :suggestions="filteredSubconList" field="name" option-label="name" forceSelection dropdown placeholder="Search Subcon" class="w-full" @complete="handleSubconSearch" />
                                </div>
                                <p v-if="showValidation && !selectedSubcon" class="text-sm text-brand-danger flex items-center gap-1"><PhXCircle :size="18"  /> Subcon is required for Unbudgeted Items</p>
                            </div>
                        </div>

                        <!-- Reason -->
                        <div>
                            <label class="block text-sm font-medium text-text-body mb-2">Reason</label>
                            <div class="flex flex-col gap-2">
                                <ProSelect v-model="selectedReason" :options="reasonOptions" placeholder="Select Reason" class="w-full" :class="{ 'border-brand-danger': showValidation && !selectedReason }" />
                                <p v-if="showValidation && !selectedReason" class="text-sm text-brand-danger flex items-center gap-1"><PhXCircle :size="18"  /> Reason is required for Unbudgeted Items</p>
                            </div>
                        </div>
                    </div>
                </Motion>
            </div>
        </ProCard>

        <Presence>
            <Motion v-if="items.length === 0" :key="budgetType" :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }" :exit="{ opacity: 0, y: -10 }" :transition="{ duration: 0.5 }" class="text-center mt-6">
                <BudgetInfoCard class="mb-4" :budgetType="budgetType" />

                <Message v-if="showValidation && items.length === 0" severity="error" :closable="false" class="mb-4 text-left">
                    <template #icon>
                        <PhXCircle class="mr-2" size="20" />
                    </template>
                    At least one item is required
                </Message>

                <ProCard class="shadow-sm py-12 flex flex-col items-center justify-center text-center">
                    <div class="text-5xl mb-3">📦</div>
                    <p class="text-text-body mb-6">No items added yet</p>
                    <div class="flex gap-3 justify-center">
                        <ProButton v-if="budgetType === 'Budgeted Item'" variant="secondary" @click="openBulkItemModal">
                            <PhPackage class="mr-2" /> Add from Budget
                        </ProButton>
                        <ProButton v-if="budgetType === 'Unbudgeted Item'" variant="primary" @click="openStockItemModal">
                            <PhPlus class="mr-2" /> Add First Item
                        </ProButton>
                    </div>
                </ProCard>
            </Motion>
        </Presence>
        <ProCard v-if="items.length > 0" class="shadow-sm mt-6">
            <div class="flex justify-between items-center mb-4 border-b pb-4">
                <h2 class="text-lg font-semibold text-text-heading">Order Items <span class="text-brand-danger">*</span></h2>
                <div class="flex gap-3">
                    <ProButton v-if="budgetType === 'Budgeted Item'" variant="secondary" @click="openBulkItemModal">
                        <PhPackage class="mr-2" /> Add from Budget
                    </ProButton>
                    <ProButton v-if="budgetType === 'Unbudgeted Item'" variant="primary" @click="openStockItemModal">
                        <PhPlus class="mr-2" /> Add First Item
                    </ProButton>
                </div>
            </div>

            <ProTable :columns="tableColumns" :data="items" class="mt-4">
                <template #empty>
                    <div class="text-center text-gray-500 py-6">No items added yet. Click "Add Item" to begin.</div>
                </template>

                <template #cell-itemCode="{ row }">
                    <div v-tooltip.top="row.itemCode" class="w-full">
                        <ProInput v-model="row.itemCode" readonly class="w-full !text-sm cursor-not-allowed opacity-75" />
                    </div>
                </template>

                <template #cell-description="{ row }">
                    <div class="text-sm text-text-body font-medium">{{ row.description }}</div>
                    <div v-if="row.notes" class="mt-2 p-1.5 bg-brand-primary/5 border border-brand-primary/20 rounded-md text-sm text-brand-primary whitespace-normal break-words w-full flex items-start gap-1.5 leading-snug" v-tooltip.top="row.notes.length > 50 ? row.notes : ''">
                        <PhFileText class="shrink-0 mt-0.5 opacity-80" />
                        <span class="line-clamp-2 italic">Note: {{ row.notes }}</span>
                    </div>
                </template>

                <template #cell-location="{ row }">
                    <div class="text-sm text-text-body">{{ row.location }}</div>
                </template>

                <template #cell-uom="{ row }">
                    <div class="text-sm text-text-body">{{ row.uom }}</div>
                </template>

                <template #cell-qty="{ row }">
                    <ProInput type="number" v-model.number="row.qty" :min="0" class="w-full !text-sm" />
                </template>

                <template #cell-deliveryDate="{ row }">
                    <ProInput type="date" :modelValue="formatDateToAPI(row.deliveryDate || '')" @update:modelValue="handleDeliveryPicker($event, row)" class="w-full !text-sm" :error="invalidDeliveryByCode[row.itemCode] ? ' ' : ''" />
                </template>

                <template #cell-price="{ row }">
                    <InputNumber v-model="row.price" mode="currency" currency="MYR" locale="en-MY" class="w-full !text-sm" :minFractionDigits="2" />
                </template>

                <template #cell-total="{ row }">
                    <div class="font-semibold text-text-heading pr-2 text-right">{{ ((row.price ?? 0) * (row.qty ?? 0)).toLocaleString('en-MY', { style: 'currency', currency: 'MYR' }) }}</div>
                </template>

                <template #cell-action="{ row }">
                    <div class="flex justify-center w-full">
                        <ProButton variant="secondary" size="sm" @click="toggleMenu($event, items.indexOf(row))">
                            <PhDotsThreeVertical />
                        </ProButton>
                        <Menu :model="getActionItems(row, items.indexOf(row))" :popup="true" :ref="(el: any) => setMenuRef(el, items.indexOf(row))">
                            <template #itemicon="{ item, class: iconClass }">
                                <component :is="item.icon" :class="iconClass" />
                            </template>
                        </Menu>
                    </div>
                </template>
            </ProTable>

            <!-- Note Modal -->
            <ProModal :modelValue="!!noteModalItem" @update:modelValue="(val: boolean) => { if(!val) noteModalItem = null; }" title="Add Note"  class="!z-[1000]">
                <div v-if="noteModalItem" class="p-4" style="min-width: 400px;">
                    <label class="block text-sm text-gray-600 mb-2 font-semibold">Note for {{ noteModalItem.itemCode }}</label>
                    <Textarea v-model="noteModalItem.notes" rows="4" class="w-full" placeholder="Add specific internal notes or instructions here..."></Textarea>
                </div>
                <template #footer>
                    <div class="flex justify-end p-4 border-t gap-2">
                        <ProButton variant="primary" @click="noteModalItem = null">Done</ProButton>
                    </div>
                </template>
            </ProModal>

            <!-- Attachments -->
            <div class="mt-4">
                <label class="block text-sm text-gray-600 mb-2">Attachments</label>
                <ProUploadFile v-model="uploadFilesList" multiple accept="image/*" :maxSize="1" />
            </div>

            <!-- Remark -->
            <div class="mt-4">
                <label class="block text-sm text-gray-600 mb-1">Remark</label>
                <Textarea v-model="overallRemark" rows="3" class="w-full" placeholder="Add any additional remarks or notes..." />
            </div>

            <!-- Summary -->
            <div class="pt-3 mt-2 border-t text-sm text-gray-600 flex justify-between">
                <span>{{ items.length }} {{ items.length > 1 ? 'items' : 'item' }}</span>
                <span>{{ budgetType === 'Budgeted Item' ? 'Budgeted' : 'Unbudgeted' }}</span>
            </div>
        </ProCard>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-6">
            <ProButton variant="secondary" @click="$router.push('/request-orders')">Cancel</ProButton>
            <ProButton variant="secondary" @click="saveDraft" v-tooltip="'Save for later'">Save as Draft</ProButton>
            <ProButton variant="primary" @click="openPreviewModal">Submit Request Order</ProButton>
        </div>

        <!-- Modals -->
        <CreateROModal v-model:visible="showBulkItemModal" :projectId="projectId" :version="0" @items-selected="handleSelectedItems" />
        <CreateStockItem v-model:visible="showStockItemModal" @items-selected="handleStockItemsSelected" />

        <PreviewRo v-model:visible="showPreviewModal" :summaryData="previewSummary" @submit="submitRequestOrder" />
    </div>
</template>
