<template>
    <Dialog :visible="visible" modal :style="{ width: '50rem' }" @update:visible="$emit('update:visible', $event)">
        <template #header>
            <span class="font-bold text-xl">Add Recommendation - {{ user.role }}</span>
        </template>

        <div class="flex flex-col gap-5 p-5 text-base">
            <!-- text-base 統一整體字體 -->
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
            <div>
                <label class="block text-sm font-medium text-gray-700">Reason (choose one):</label>
                <div class="flex flex-col gap-2 ml-3 mt-1">
                    <div v-for="(reason, idx) in reasonOptions" :key="idx" class="flex items-center gap-2">
                        <RadioButton :inputId="'reason_' + idx" name="reasonSelection" :value="reason.value" v-model="reasonSelection" />
                        <label :for="'reason_' + idx" class="text-base">{{ reason.label }}</label>
                    </div>
                </div>
            </div>

            <!-- Attachment -->
            <div>
                <label class="block text-sm font-medium text-gray-700">Upload Attachment (Optional)</label>
                <FileUpload mode="advanced" name="files" :auto="false" :customUpload="true" @select="onFileSelect" accept="image/*" :maxFileSize="1000000" chooseLabel="Upload Attachment" :multiple="true" class="text-base">
                    <template #empty>
                        <span class="text-base text-gray-400">Drag and drop files here to upload.</span>
                    </template>
                </FileUpload>
            </div>

            <!-- Recommendation Selection -->
            <div>
                <label class="block text-sm font-medium text-gray-700">Recommendation (choose one):</label>
                <div class="flex flex-col gap-2 ml-3 mt-1">
                    <div class="flex items-center gap-2">
                        <RadioButton inputId="qs" name="recommendation" value="QS_Recommendation" v-model="selection" />
                        <label for="qs" class="text-base">Please Change Budget Quantity</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <RadioButton inputId="site" name="recommendation" value="Site_Recommendation" v-model="selection" />
                        <label for="site" class="text-base">Remain Original Budget</label>
                    </div>
                </div>
            </div>

            <!-- Budget Item Adjustment -->
            <div v-if="selection === 'QS_Recommendation'">
                <label class="block text-sm font-medium text-gray-700 mb-2">Budget Item Adjustment</label>
                <div class="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-base font-semibold text-gray-700">Adjustment List</span>
                        <Button label="Add" icon="pi pi-plus" size="small" class="p-button-sm" @click="addAdjustment" />
                    </div>

                    <div v-if="adjustments.length === 0" class="text-base text-gray-400 py-2">No adjustment added.</div>

                    <div v-for="(item, index) in adjustments" :key="index" class="grid grid-cols-12 gap-2 items-center text-base font-normal text-gray-700">
                        <span class="col-span-1">{{ index + 1 }}</span>
                        <Dropdown v-model="item.id" :options="budgetItemList" optionLabel="ItemCode" optionValue="Id" placeholder="Budget Item Code" class="col-span-5 text-base" />
                        <InputText v-model="item.value" placeholder="Value" class="col-span-5 text-base" />
                        <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm col-span-1" @click="removeAdjustment(index)" />
                    </div>
                </div>
            </div>

            <!-- Remark -->
            <div>
                <label class="block text-sm font-medium text-gray-700">Remark <span class="text-danger">*</span></label>
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

<script lang="ts">
import { useBudgetChangeRequestStore } from '@/stores/budget/budgetChangeRequest.store';
import type { BCRRecommendationPayload } from '@/types/budgetChangeRequest.type';
import { useToast } from 'primevue/usetoast';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

interface AdjustmentItem {
    id: number | null;
    code: string | null;
    value: string;
}

export default defineComponent({
    props: { visible: { type: Boolean, required: true } },
    emits: ['update:visible', 'submit'],
    setup(props, { emit }) {
        const route = useRoute();
        const toast = useToast();
        const budgetCRStore = useBudgetChangeRequestStore();
        const budgetChangeRequestId = Number(route.params.budgetChangeRequestId);

        const user = ref({ role: '', username: '' });
        const singleBudgetChangeRequest = ref<any>(null);
        const adjustments = ref<AdjustmentItem[]>([]);
        const selection = ref<string>(''); // Recommendation Selection
        const reasonSelection = ref<string>(''); // Reason Selection
        const remark = ref<string>('');
        const selectedFiles = ref<File[]>([]);

        const reasonOptions = [
            { label: 'Overall remeasurement (please attach revised budget sheet)', value: 'Overall Remeasurement' },
            { label: 'Mock up budget: revise of material budget revision based on completed mock up unit', value: 'Mock Up Budget' },
            { label: 'Budget adjustment/refinement; ie. BQ quantity insufficient etc.', value: 'Budget Adjustment' },
            { label: 'VO and changes (could be own initiation etc)', value: 'VO and Changes' },
            { label: 'Others (please specify)', value: 'Others' }
        ];

        onMounted(async () => {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            user.value.role = storedUser.role || 'Project Director';
            user.value.username = storedUser.username || 'Unknown User';

            if (budgetChangeRequestId) {
                const data = await budgetCRStore.getSingleBudgetChange(budgetChangeRequestId);
                singleBudgetChangeRequest.value = data;
            }
        });

        const budgetItemList = computed(() => singleBudgetChangeRequest.value?.budget_change_items || []);

        function addAdjustment() {
            adjustments.value.push({ id: null, code: null, value: '' });
        }

        function removeAdjustment(index: number) {
            adjustments.value.splice(index, 1);
        }

        function normalizeDepartment(dept: string | null): string {
            if (!dept) return '';
            const lower = dept.toLowerCase();
            if (lower === 'site staff' || lower === 'site' || lower === 'project manager') return 'Site';
            return dept;
        }

        function onFileSelect(event: { files: File[] }) {
            selectedFiles.value = event.files;
            toast.add({
                severity: 'info',
                summary: 'Files Attached',
                detail: `${event.files.length} file(s) added`,
                life: 2500
            });
        }

        // Watch Recommendation Selection, 自動清空調整項目
        watch(selection, (val) => {
            if (val === 'Site_Recommendation') {
                adjustments.value = [];
            }
        });

        async function handleSubmit() {
            if (!remark.value.trim()) {
                toast.add({
                    severity: 'warn',
                    summary: 'Remark Required',
                    detail: 'Please enter your remark before submitting.',
                    life: 3000
                });
                return;
            }

            const recommendedItems = adjustments.value
                .filter((a) => a.id != null && a.value)
                .map((a) => ({
                    BudgetChangeItemId: a.id!,
                    RecommendedQty: Number(a.value)
                }));

            const payload: BCRRecommendationPayload = {
                Department: normalizeDepartment(user.value.role),
                PersonInCharge: user.value.username,
                RecommendationType: selection.value,
                Reason: reasonSelection.value,
                Remark: remark.value,
                files: [],
                RecommendedItems: recommendedItems
            };

            try {
                await budgetCRStore.createBCRRecommendation(budgetChangeRequestId, payload, selectedFiles.value);
                // Reset
                selection.value = '';
                reasonSelection.value = '';
                remark.value = '';
                adjustments.value = [];
                selectedFiles.value = [];
                emit('update:visible', false);
                emit('submit');
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit recommendation', life: 3000 });
            }
        }

        return {
            user,
            selection,
            reasonSelection,
            remark,
            selectedFiles,
            adjustments,
            budgetItemList,
            reasonOptions,
            addAdjustment,
            removeAdjustment,
            onFileSelect,
            handleSubmit
        };
    }
});
</script>
