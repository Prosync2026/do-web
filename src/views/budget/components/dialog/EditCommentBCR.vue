<script src="./EditCommentBCR.script.ts"></script>
<template>
    <Teleport to="body">
        <ProModal :modelValue="visible" @update:modelValue="$emit('update:visible', $event)" title="" size="lg" class="!z-[1000]">
            <template #header>
                <span class="font-bold text-xl"> Edit Comments - {{ user.role }} </span>
            </template>

            <div class="flex flex-col gap-5">
                <!-- User Info -->
                <div class="grid grid-cols-2 gap-5">
                    <div>
                        <ProInput :modelValue="user.role" label="Role" disabled />
                    </div>
                    <div>
                        <ProInput :modelValue="user.username" label="Person in Charge" disabled />
                    </div>
                </div>

                <!-- Reason -->
                <div v-if="reasonOptions.length > 0">
                    <ProSelect :modelValue="reasonSelection" @update:modelValue="reasonSelection = $event" :options="reasonOptions" placeholder="Select Reason" label="Reason (choose one):" class="w-full" />
                </div>

                <!-- Recommendation -->
                <div v-if="recommendationOptions.length">
                    <ProSelect :modelValue="selection" @update:modelValue="selection = $event" :options="recommendationOptions" placeholder="Select Recommendation" label="Recommendation (choose one, optional):" class="w-full" />
                </div>

                <div v-if="showAdjustmentList" class="adjustment-container text-sm">
                    <label class="block font-medium text-gray-700 mb-2">Budget Item Adjustment</label>

                    <div class="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
                        <!-- Header -->
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-semibold text-gray-700">Adjustment List</span>
                            <ProButton variant="primary" size="sm" @click="addAdjustment">Add</ProButton>
                        </div>

                        <!-- Column Titles -->
                        <div class="grid grid-cols-9 gap-4 text-gray-500 font-medium border-b border-gray-200 pb-1">
                            <span class="col-span-1 text-center">#</span>
                            <span class="col-span-3">Item Code</span>
                            <span class="col-span-2">Old Qty</span>
                            <span class="col-span-2">New Qty</span>
                            <span class="col-span-1"></span>
                            <!-- Delete button column -->
                        </div>

                        <!-- Empty State -->
                        <ProEmpty v-if="adjustments.length === 0" title="No Adjustments" description="No adjustment added yet." />

                        <!-- Adjustment Rows -->
                        <div v-for="(item, index) in adjustments" :key="index" class="grid grid-cols-9 gap-4 items-center text-gray-700">
                            <div class="col-span-1 text-center">{{ index + 1 }}</div>

                            <div class="col-span-3">
                                <ProSelect v-model="item.id" :options="budgetItemList.map((b) => ({ label: b.ItemCode, value: b.Id }))" placeholder="Budget Item Code" class="w-full text-sm" @update:modelValue="() => onSelectItem(item)" />
                            </div>

                            <div class="col-span-2">
                                <ProInput :modelValue="item.OrderedQty?.toString()" placeholder="Ordered Qty" class="w-full text-sm" disabled />
                            </div>

                            <div class="col-span-2">
                                <ProInput v-model="item.value" placeholder="New Request Qty" class="w-full text-sm" />
                            </div>

                            <div class="col-span-1">
                                <ProButton variant="danger" size="sm" class="w-full" @click="removeAdjustment(index)">Delete</ProButton>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Attachment -->
                <div v-if="showAttachment">
                    <ProUploadFile v-model="selectedFiles" multiple accept="image/*" :maxSize="10" label="Upload Attachment (Optional)" />
                </div>

                <!-- Remark -->
                <div>
                    <ProTextarea v-model="remark" label="Remark" :rows="3" placeholder="Enter your remark..." required />
                </div>
            </div>

            <!-- Footer Buttons -->
            <template #footer>
                <div class="flex justify-end gap-3">
                    <ProButton variant="secondary" size="sm" @click="$emit('update:visible', false)">Cancel</ProButton>
                    <ProButton variant="primary" size="sm" @click="handleSubmit">Submit Recommendation</ProButton>
                </div>
            </template>

            <!-- Toast -->
            <ProToast v-model="toastState.visible" :type="toastState.type" :message="toastState.message" :autoDismiss="true" :duration="3000" />
        </ProModal>
    </Teleport>
</template>
