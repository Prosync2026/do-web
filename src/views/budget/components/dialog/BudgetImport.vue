<script setup lang="ts">
import { PhDownload } from '@phosphor-icons/vue';
import { ProButton, ProModal, ProToast, ProUploadFile } from '@prosync_solutions/ui';
import type { UploadFile } from '@prosync_solutions/ui';
import useImportBudgetDialogLogic from './BudgetImport.script';
import { ref, watch } from 'vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'success'): void;
}>();

const { internalVisible, onHide, onDownloadFormat, onSubmitUpload, selectedFile, isSubmitting, toastState } = useImportBudgetDialogLogic(props, emit);

const proFiles = ref<UploadFile[]>([]);

watch(proFiles, (newVal) => {
    if (newVal && newVal.length > 0) {
        selectedFile.value = newVal[0].file;
    } else {
        selectedFile.value = null;
    }
}, { deep: true });

watch(internalVisible, (visible) => {
    if (!visible) proFiles.value = [];
});
</script>

<template>
    <Teleport to="body">
        <ProModal v-model="internalVisible" title="Import Budget Items" size="lg" class="!z-[100]" @update:modelValue="!$event && onHide()">
            <div class="flex items-start justify-between mb-3 gap-4">
                <p class="m-0 text-muted text-sm leading-relaxed">
                    Upload a <strong>CSV</strong> or <strong>Excel</strong> file with budget items.<br />
                    <span class="text-secondary"> Required columns: item_code, description, category, element, sub_element, 1st_sub_element, 2nd_sub_element, location1, location2, uom, budget_qty, rate, amount, wastage. </span>
                </p>

                <ProButton variant="secondary" size="sm" @click="onDownloadFormat" class="shrink-0 flex items-center gap-2">
                    <PhDownload :size="16" />
                    <span>Download</span>
                </ProButton>
            </div>

                        <ProToast v-model="toastState.visible" :type="toastState.type" :message="toastState.message" :autoDismiss="true" :duration="3000" />
            <ProUploadFile 
                v-model="proFiles" 
                :multiple="false" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                infoText="Upload a budget template file"
                class="w-full mb-3" 
            />

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
