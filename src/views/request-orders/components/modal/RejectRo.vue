<script setup lang="ts">
import { PhWarning, PhX } from '@phosphor-icons/vue';
import { ProButton, ProModal } from '@prosync_solutions/ui';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    visible: Boolean,
    orderNumber: String
});

const emit = defineEmits(['update:visible', 'reject']);

const remark = ref('');
const localVisible = ref(props.visible);

const isValid = computed(() => remark.value.trim().length > 0);

watch(
    () => props.visible,
    (val) => {
        localVisible.value = val;
        if (!val) {
            remark.value = ''; // Clear when dialog closes
        }
    }
);

watch(localVisible, (val) => {
    emit('update:visible', val);
});

function cancel() {
    remark.value = '';
    localVisible.value = false;
}

function confirmReject() {
    if (!isValid.value) return;

    emit('reject', remark.value);
    remark.value = '';
    localVisible.value = false;
}
</script>

<template>
    <ProModal
        :modelValue="localVisible"
        @update:modelValue="(val: boolean) => { localVisible = val; if (!val) cancel(); }"
        title="Reject Request Order"
        size="sm"
        class="!z-[1000]"
    >
        <div class="flex flex-col gap-4">
            <p v-if="orderNumber" class="text-body-sm text-text-subtitle">
                Order: <span class="text-body-sm-bold text-text-heading">{{ orderNumber }}</span>
            </p>

            <div class="flex flex-col gap-2">
                <label for="remark" class="text-body-sm-bold text-text-heading">
                    Reason for Rejection <span class="text-text-error">*</span>
                </label>
                <textarea
                    id="remark"
                    v-model="remark"
                    rows="5"
                    placeholder="Please provide a detailed reason for rejection..."
                    class="w-full px-3 py-2 border rounded-button text-body-sm text-text-body bg-surface-sub-bg resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-colors"
                    :class="!isValid && remark.length > 0 ? 'border-border-error' : 'border-border-border'"
                />
                <p v-if="!isValid && remark.length > 0" class="text-caption text-text-error">
                    Remark is required
                </p>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3">
                <ProButton variant="secondary" @click="cancel">
                    <template #iconLeft><PhX :size="16" /></template>
                    Cancel
                </ProButton>
                <ProButton variant="danger" class="" @click="confirmReject" :disabled="!isValid">
                    <template #iconLeft><PhWarning :size="16" /></template>
                    Confirm Rejection
                </ProButton>
            </div>
        </template>
    </ProModal>
</template>

