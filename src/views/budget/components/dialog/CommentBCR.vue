<script lang="ts" src="./CommentBCR.script"></script>

<template>
    <Dialog :visible="visible" modal :style="{ width: '40rem' }" @update:visible="$emit('update:visible', $event)">
        <!-- Header -->
        <template #header>
            <span class="font-bold text-lg">Add Recommendation - {{ user.role }}</span>
        </template>

        <div class="flex flex-col gap-4">
            <span class="text-gray-600 text-sm"> Submit your recommendation for this budget change request as {{ user.role }} department. </span>

            <!-- Department & Person in Charge -->
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

            <!-- Quantity -->
            <div v-if="selection === 'Specific_Quantity'">
                <label class="font-medium block mb-1">Enter Quantity</label>
                <InputText v-model="specificQuantity" placeholder="Enter quantity..." class="w-full" />
            </div>

            <!-- Remark -->
            <div>
                <label class="font-medium block mb-1">Remark <span class="text-danger">*</span></label>
                <Textarea v-model="remark" rows="3" placeholder="Enter your remark..." class="w-full" />
            </div>

            <!-- Upload Attachment -->
            <div>
                <label class="font-medium block mb-5"> Upload Attachment <span class="text-gray-500 text-sm">(Optional)</span> </label>
                <Toast />

                <FileUpload mode="advanced" name="files" :auto="false" :customUpload="true" @select="onFileSelect" accept="image/*" :maxFileSize="1000000" chooseLabel="Upload Attachment" class="custom-file-upload" :multiple="true">
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
