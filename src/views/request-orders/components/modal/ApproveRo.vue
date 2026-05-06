<script setup lang="ts">
import { ref, watch } from 'vue';
import { ProButton, ProModal } from '@prosync_solutions/ui';
import { PhCheck, PhX } from '@phosphor-icons/vue';

const props = defineProps({
    visible: Boolean,
    orderNumber: String
});

const emit = defineEmits(['update:visible', 'approve']);

const localVisible = ref(props.visible);

watch(
    () => props.visible,
    (val) => {
        localVisible.value = val;
    }
);

watch(localVisible, (val) => {
    emit('update:visible', val);
});

function cancel() {
    localVisible.value = false;
}

function confirmApprove() {
    emit('approve');
    localVisible.value = false;
}
</script>

<template>
    <ProModal
        :modelValue="localVisible"
        @update:modelValue="(val: boolean) => { localVisible = val; if (!val) cancel(); }"
        title="Confirm Approval"
        size="sm"
        class="!z-[1000]"
    >
        <div class="flex flex-col gap-4">
            <p class="text-body-sm text-text-body">
                Are you sure you want to approve request order <span v-if="orderNumber" class="text-body-sm-bold text-text-heading">{{ orderNumber }}</span>?
            </p>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3">
                <ProButton variant="secondary" @click="cancel">
                    <template #iconLeft><PhX :size="16" /></template>
                    Cancel
                </ProButton>
                <ProButton variant="primary" @click="confirmApprove">
                    <template #iconLeft><PhCheck :size="16" /></template>
                    Yes, Approve
                </ProButton>
            </div>
        </template>
    </ProModal>
</template>
