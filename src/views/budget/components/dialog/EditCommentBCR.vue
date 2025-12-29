<script src="./EditCommentBCR.script.ts"></script>
<template>
    <Dialog :visible="visible" modal :style="{ width: '50rem' }" @update:visible="$emit('update:visible', $event)">
        <template #header>
            <span class="font-bold text-xl"> Edit Recommendation - {{ user.role }} </span>
        </template>

        <div class="flex flex-col gap-5">
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

            <!-- Reason -->
            <div v-if="reasonOptions.length">
                <label class="block text-sm font-medium text-gray-700"> Reason (choose one): </label>
                <div class="flex flex-col gap-2 ml-3 mt-1">
                    <div v-for="(reason, idx) in reasonOptions" :key="idx" class="flex items-center gap-2">
                        <RadioButton :inputId="'reason_' + idx" name="reasonSelection" :value="reason.value" v-model="reasonSelection" />
                        <label :for="'reason_' + idx" class="text-base">
                            {{ reason.label }}
                        </label>
                    </div>
                </div>
            </div>

            <!-- Recommendation -->
            <div v-if="recommendationOptions.length">
                <label class="block text-sm font-medium text-gray-700"> Recommendation (choose one, optional): </label>
                <div class="flex flex-col gap-2 ml-3 mt-1">
                    <div v-for="(rec, idx) in recommendationOptions" :key="idx" class="flex items-center gap-2">
                        <RadioButton :inputId="'rec_' + idx" name="recommendation" :value="rec.value" v-model="selection" :uncheckable="true" />
                        <label :for="'rec_' + idx" class="text-base">
                            {{ rec.label }}
                        </label>
                    </div>
                </div>
            </div>

            <!-- Adjustment -->
            <div v-if="showAdjustmentList" class="adjustment-container text-sm">
                <label class="block font-medium text-gray-700 mb-2"> Budget Item Adjustment </label>

                <div class="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold text-gray-700">Adjustment List</span>
                        <Button label="Add" icon="pi pi-plus" size="small" class="p-button-sm" @click="addAdjustment" />
                    </div>

                    <div v-if="adjustments.length === 0" class="text-gray-400 py-2">No adjustment added.</div>

                    <div v-for="(item, index) in adjustments" :key="index" class="grid grid-cols-12 gap-2 items-center">
                        <span class="col-span-1">{{ index + 1 }}</span>
                        <Dropdown v-model="item.id" :options="budgetItemList" optionLabel="ItemCode" optionValue="Id" placeholder="Budget Item Code" class="col-span-5 text-sm" />
                        <InputText v-model="item.value" placeholder="Value" class="col-span-5 text-sm" />
                        <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm col-span-1" @click="removeAdjustment(index)" />
                    </div>
                </div>
            </div>

            <!-- Attachment -->
            <div>
                <label class="block text-sm font-medium text-gray-700"> Upload Attachment (Optional) </label>
                <FileUpload mode="advanced" name="files" :auto="false" :customUpload="true" @select="onFileSelect" :multiple="true" class="text-sm" />
            </div>

            <!-- Remark -->
            <div>
                <label class="block text-sm font-medium text-gray-700"> Remark <span class="text-danger">*</span> </label>
                <Textarea v-model="remark" rows="3" placeholder="Enter your remark..." class="w-full text-base" />
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-3 mt-4">
                <Button label="Cancel" outlined class="p-button-sm" @click="$emit('update:visible', false)" />
                <Button label="Submit Recommendation" class="p-button-sm" @click="handleSubmit" />
            </div>
        </div>
    </Dialog>
</template>
