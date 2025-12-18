<script src="./CommentBCR.script.ts"></script>

<template>
    <Dialog :visible="visible" modal :style="{ width: '40rem' }" @update:visible="$emit('update:visible', $event)">
        <template #header>
            <span class="font-bold text-lg">Add Recommendation - {{ user.role }}</span>
        </template>

        <div class="flex flex-col gap-4">
            <span class="text-gray-600 text-sm"> Submit your recommendation for this budget change request as {{ user.role }} department. </span>

            <!-- User Info -->
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="font-medium block mb-1">Roles</label>
                    <InputText :value="user.role" class="w-full" disabled />
                </div>
                <div>
                    <label class="font-medium block mb-1">Person in Charge</label>
                    <InputText :value="user.username" class="w-full" disabled />
                </div>
            </div>

            <!-- Selection -->
            <div>
                <label class="font-medium block mb-1">Selection (Choose one):</label>
                <div class="flex flex-col gap-2 ml-2 mt-1">
                    <div class="flex items-center gap-2">
                        <RadioButton inputId="qs" name="selection" value="QS_Recommendation" v-model="selection" />
                        <label for="qs">Change Budget Qty according to QS recommendation</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <RadioButton inputId="site" name="selection" value="Site_Recommendation" v-model="selection" />
                        <label for="site">Change Budget Qty according to Site recommendation</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <RadioButton inputId="specific" name="selection" value="Specific_Quantity" v-model="selection" />
                        <label for="specific">Change Budget Qty to specific amount</label>
                    </div>
                </div>
            </div>

            <!-- Budget Item Adjustment -->
            <div>
                <label class="font-medium block mb-2">Budget Item Adjustment</label>
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-sm font-semibold text-gray-700">Adjustment List</span>
                        <Button label="Add" icon="pi pi-plus" size="small" class="p-button-sm" @click="addAdjustment" />
                    </div>

                    <div v-if="adjustments.length === 0" class="text-sm text-gray-400 py-3">No adjustment added.</div>

                    <div v-for="(item, index) in adjustments" :key="index" class="flex items-center gap-3 mb-2">
                        <span class="text-xs text-gray-400 w-5">{{ index + 1 }}</span>

                        <Dropdown v-model="item.id" :options="budgetItemList" optionLabel="ItemCode" optionValue="Id" placeholder="Budget Item Code" class="flex-1" />

                        <InputText v-model="item.value" placeholder="Value" class="flex-1" />

                        <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" @click="removeAdjustment(index)" />
                    </div>
                </div>
            </div>

            <!-- Remark -->
            <div>
                <label class="font-medium block mb-1">Remark <span class="text-danger">*</span></label>
                <Textarea v-model="remark" rows="3" placeholder="Enter your remark..." class="w-full" />
            </div>

            <!-- Upload -->
            <div>
                <label class="font-medium block mb-3">
                    Upload Attachment
                    <span class="text-gray-500 text-sm">(Optional)</span>
                </label>

                <Toast />

                <FileUpload mode="advanced" name="files" :auto="false" :customUpload="true" @select="onFileSelect" accept="image/*" :maxFileSize="1000000" chooseLabel="Upload Attachment" :multiple="true">
                    <template #empty>
                        <span>Drag and drop files here to upload.</span>
                    </template>
                </FileUpload>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-2 mt-4">
                <Button label="Cancel" outlined @click="$emit('update:visible', false)" />
                <Button label="Submit Recommendation" @click="handleSubmit" />
            </div>
        </div>
    </Dialog>
</template>
