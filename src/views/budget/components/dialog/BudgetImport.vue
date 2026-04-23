<script setup lang="ts">
import { PhDownload, PhFileXls } from '@phosphor-icons/vue';
import { ProButton, ProModal, ProToast } from '@prosync_solutions/ui';
import FileUpload from 'primevue/fileupload';
import useImportBudgetDialogLogic from './BudgetImport.script';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'success'): void;
}>();

const { internalVisible, onHide, onFileSelect, onDownloadFormat, onSubmitUpload, selectedFile, isSubmitting, toastState } = useImportBudgetDialogLogic(props, emit);
</script>

<template>
    <Teleport to="body">
        <ProModal v-model="internalVisible" title="Import Budget Items" size="lg" @update:modelValue="!$event && onHide()">
            <div class="flex items-start justify-between mb-3 gap-4">
                <p class="m-0 text-muted text-sm leading-relaxed">
                    Upload a <strong>CSV</strong> or <strong>Excel</strong> file with budget items.<br />
                    <span class="text-secondary"> Required columns: item_code, description, element, sub_element, 1st_sub_element, 2nd_sub_element, location1, location2, uom, budget_qty, rate, amount, wastage. </span>
                </p>

                <a href="javascript:void(0)" @click="onDownloadFormat" class="flex flex-col items-center text-primary text-xs hover:text-blue-600 transition-all duration-200">
                    <PhDownload :size="18" class="text-lg mb-1"  />
                    <span class="text-center leading-tight">Download</span>
                </a>
            </div>

            <Toast />
            <ProToast v-model="toastState.visible" :type="toastState.type" :message="toastState.message" :autoDismiss="true" :duration="3000" />
            <FileUpload mode="basic" name="file" customUpload @select="onFileSelect" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" chooseLabel="Choose File" class="w-full mb-3" />

            <div v-if="selectedFile" class="text-sm text-green-700 mt-2"><PhFileXls :size="18" class="mr-1"  /> {{ selectedFile.name }}</div>

            <div class="flex justify-end gap-3 mt-4">
                <ProButton variant="secondary" @click="onHide">Cancel</ProButton>
                <ProButton variant="primary" :loading="isSubmitting" :disabled="!selectedFile || isSubmitting" @click="onSubmitUpload">Submit</ProButton>
            </div>
        </ProModal>
    </Teleport>
</template>

<style scoped>
.text-secondary {
    color: #6c757d;
}
</style>
