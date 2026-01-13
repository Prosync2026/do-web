<script src="./CommentBCR.script.ts"></script>
<template>
    <Dialog :visible="visible" modal :style="{ width: '70rem' }" @update:visible="$emit('update:visible', $event)">
        <template #header>
            <span class="font-bold text-xl">Add Comments - {{ user.role }}</span>
        </template>

        <div class="flex flex-col gap-5 p-5 text-base">
            <!-- User Info -->
            <div class="grid grid-cols-2 gap-5">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Role</label>
                    <InputText :value="user.role" disabled class="w-full text-base" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Person in Charge</label>
                    <InputText :value="user.username" disabled class="w-full text-base" />
                </div>
            </div>

            <!-- Reason Selection -->
            <div v-if="reasonOptions.length === '0'">
                <label class="block text-sm font-medium text-gray-700">Reason (choose one):</label>
                <div class="flex flex-col gap-2 ml-3 mt-1">
                    <div v-for="(reason, idx) in reasonOptions" :key="idx" class="flex items-center gap-2">
                        <RadioButton :inputId="'reason_' + idx" name="reasonSelection" :value="reason.value" v-model="reasonSelection" />
                        <label :for="'reason_' + idx" class="text-base">{{ reason.label }}</label>
                    </div>
                </div>
            </div>

            <!-- Recommendation Selection -->
            <div v-if="recommendationOptions">
                <label class="block text-sm font-medium text-gray-700">Recommendation (choose one, optional):</label>
                <div class="flex flex-col gap-2 ml-3 mt-1">
                    <div v-for="(rec, idx) in recommendationOptions" :key="idx" class="flex items-center gap-2">
                        <RadioButton :inputId="'rec_' + idx" name="recommendation" :value="rec.value" v-model="selection" :uncheckable="true" />
                        <label :for="'rec_' + idx" class="text-base">{{ rec.label }}</label>
                    </div>
                </div>
            </div>

            <!-- Adjustment List -->
            <div v-if="showAdjustmentList" class="adjustment-container text-sm">
                <label class="block font-medium text-gray-700 mb-2">Budget Item Adjustment</label>

                <div class="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold text-gray-700">Adjustment List</span>
                        <Button label="Add" icon="pi pi-plus" size="small" class="p-button-sm" @click="addAdjustment" />
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
                    <div v-if="adjustments.length === 0" class="text-gray-400 py-2 italic">No adjustment added.</div>

                    <!-- Adjustment Rows -->
                    <div v-for="(item, index) in adjustments" :key="index" class="grid grid-cols-12 gap-2 items-center text-gray-700">
                        <!-- Index -->
                        <span class="col-span-1 text-center">{{ index + 1 }}</span>

                        <!-- Item Code Dropdown -->
                        <Dropdown v-model="item.Id" :options="budgetItemList" optionLabel="ItemCode" optionValue="Id" placeholder="Budget Item Code" class="col-span-3 text-sm" @change="() => onSelectItem(item)" />

                        <!-- Description -->
                        <InputText v-model="item.Description" placeholder="Description" class="col-span-3 text-sm" disabled />

                        <!-- Ordered Qty -->
                        <InputText v-model="item.OrderedQty" placeholder="Ordered Qty" class="col-span-2 text-sm" disabled />

                        <!-- New Request Qty -->
                        <InputText v-model="item.value" placeholder="New Request Qty" class="col-span-2 text-sm" />

                        <!-- Delete Button -->
                        <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm col-span-1" @click="removeAdjustment(index)" />
                    </div>
                </div>
            </div>

            <!-- File Upload -->
            <div v-if="user.role === 'QS' || user.role === 'SITE'" class="text-sm">
                <label class="block font-medium text-gray-700">Upload Attachment (Optional)</label>
                <FileUpload mode="advanced" name="files" :auto="false" :customUpload="true" @select="onFileSelect" accept="image/*" :maxFileSize="1000000" chooseLabel="Upload Attachment" :multiple="true" class="text-sm">
                    <template #empty>
                        <span class="text-gray-400">Drag and drop files here to upload.</span>
                    </template>
                </FileUpload>
            </div>

            <!-- Remark -->
            <div>
                <label class="block text-sm font-medium text-gray-700">Remark</label>
                <Textarea v-model="remark" rows="3" placeholder="Enter your remark..." class="w-full text-base" />
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-3 mt-4">
                <Button label="Cancel" outlined class="p-button-sm" @click="$emit('update:visible', false)" />

                <!-- if roles is  CM / PD / MGM -->
                <template v-if="['CM', 'PD', 'MGM'].includes(user.role)">
                    <Button label="Approve" class="p-button-sm" @click="() => handleReviewSubmit('approve')" />
                    <Button label="Reject" class="p-button-sm p-button-danger" @click="() => handleReviewSubmit('reject')" />
                </template>

                <template v-else>
                    <Button label="Submit Recommendation" class="p-button-sm" @click="handleSubmit" />
                </template>
            </div>
        </div>
    </Dialog>
</template>
