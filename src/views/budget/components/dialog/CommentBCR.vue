<script src="./CommentBCR.script.ts"></script>
<template>
    <Teleport to="body">
        <ProModal :modelValue="visible" @update:modelValue="$emit('update:visible', $event)" title="" size="xl" class="!z-[1000]">
        <template #header>
            <span class="font-bold text-xl">Add Comments - {{ user.role }}</span>
        </template>

            <div class="flex flex-col gap-5 p-5 text-base">
                <!-- User Info -->
                <div class="grid grid-cols-2 gap-5">
                    <div>
                        <ProInput :modelValue="user.role" label="Role" disabled />
                    </div>
                    <div>
                        <ProInput :modelValue="user.username" label="Person in Charge" disabled />
                    </div>
                </div>

                <!-- Reason Selection -->
                <div v-if="reasonOptions.length > 0">
                    <ProSelect :modelValue="reasonSelection" @update:modelValue="reasonSelection = $event" :options="reasonOptions" placeholder="Select Reason" label="Reason (choose one):" class="w-full" />
                </div>

                <!-- Recommendation Selection -->
                <div v-if="recommendationOptions.length > 0">
                    <ProSelect :modelValue="selection" @update:modelValue="selection = $event" :options="recommendationOptions" placeholder="Select Recommendation" label="Recommendation (choose one, optional):" class="w-full" />
                </div>

                <!-- Adjustment List -->
                <div v-if="showAdjustmentList" class="adjustment-container text-sm">
                    <label class="block font-medium text-gray-700 mb-2">Budget Item Adjustment</label>

                    <div class="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-semibold text-gray-700">Adjustment List</span>
                            <ProButton variant="primary" size="sm" @click="addAdjustment">Add</ProButton>
                        </div>

                        <!-- Column Titles -->
                        <div class="grid grid-cols-12 gap-2 text-gray-500 font-medium border-b border-gray-200 pb-1">
                            <span class="col-span-1 text-center">#</span>
                            <span class="col-span-3">Item Code</span>
                            <span class="col-span-3">Description</span>
                            <span class="col-span-2">Old Qty</span>
                            <span class="col-span-2">New Qty</span>
                            <span class="col-span-1"></span>
                            <!-- Delete button column -->
                        </div>

                        <!-- Empty State -->
                        <ProEmpty v-if="adjustments.length === 0" title="No Adjustments" description="No adjustment added yet." />

                        <!-- Adjustment Rows -->
                        <div v-for="(item, index) in adjustments" :key="index" class="grid grid-cols-12 gap-2 items-center text-gray-700">
                            <!-- Index -->
                            <div class="col-span-1 text-center">{{ index + 1 }}</div>

                            <!-- Item Code Dropdown -->
                            <div class="col-span-3">
                                <ProSelect v-model="item.Id" :options="budgetItemList.map((b) => ({ label: b.ItemCode, value: b.Id }))" placeholder="Budget Item Code" class="w-full text-sm" @update:modelValue="() => onSelectItem(item)" />
                            </div>

                            <!-- Description -->
                            <div class="col-span-3">
                                <ProInput v-model="item.Description" placeholder="Description" class="w-full text-sm" disabled />
                            </div>

                            <!-- Ordered Qty -->
                            <div class="col-span-2">
                                <ProInput :modelValue="item.OrderedQty" placeholder="Ordered Qty" class="w-full text-sm" disabled />
                            </div>

                            <!-- New Request Qty -->
                            <div class="col-span-2">
                                <ProInput v-model="item.value" placeholder="New Request Qty" class="w-full text-sm" />
                            </div>

                            <!-- Delete Button -->
                            <div class="col-span-1">
                                <ProButton variant="danger" size="sm" class="w-full" @click="removeAdjustment(index)">Delete</ProButton>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- File Upload -->
                <div v-if="user.role === 'QS' || user.role === 'SITE'" class="text-sm">
                    <ProUploadFile v-model="selectedFiles" multiple accept="image/*" :maxSize="10" label="Upload Attachment (Optional)" />
                </div>

                <!-- Remark -->
                <div>
                    <ProTextarea v-model="remark" label="Remark" :rows="3" placeholder="Enter your remark..." />
                </div>
            </div>

            <!-- Footer Buttons -->
            <template #footer>
                <div class="flex justify-end gap-3">
                    <ProButton variant="secondary" size="sm" @click="$emit('update:visible', false)">Cancel</ProButton>

                    <template v-if="['CM', 'PD', 'MGM', 'PURC'].includes(user.role)">
                        <ProButton variant="primary" size="sm" @click="() => handleReviewSubmit('approve')">{{ user.role === 'PURC' ? 'Acknowledge' : 'Approve' }}</ProButton>
                        <ProButton variant="danger" size="sm" @click="() => handleReviewSubmit('reject')">Reject</ProButton>
                    </template>

                    <template v-else>
                        <ProButton variant="primary" size="sm" @click="handleSubmit">Submit Recommendation</ProButton>
                    </template>
                </div>
            </template>

            <!-- Toast -->
            <ProToast v-model="toastState.visible" :type="toastState.type" :message="toastState.message" :autoDismiss="true" :duration="3000" />
        </ProModal>
    </Teleport>
</template>
