<script setup lang="ts">
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
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
    <Dialog v-model:visible="localVisible" header="Reject Request Order" modal :style="{ width: '500px' }" :closable="true">
        <div class="flex flex-col gap-4 py-4">
            <p v-if="orderNumber" class="text-sm text-gray-600 dark:text-gray-400">
                Order: <span class="font-semibold">{{ orderNumber }}</span>
            </p>

            <div class="flex flex-col gap-2">
                <label for="remark" class="font-semibold text-sm"> Reason for Rejection <span class="text-red-500">*</span> </label>
                <Textarea id="remark" v-model="remark" rows="5" placeholder="Please provide a detailed reason for rejection..." class="w-full" autoResize :class="{ 'p-invalid': !isValid && remark.length > 0 }" />
                <small v-if="!isValid && remark.length > 0" class="text-red-500"> Remark is required </small>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" severity="secondary" outlined @click="cancel" />
                <Button label="Confirm Rejection" severity="danger" @click="confirmReject" :disabled="!isValid" />
            </div>
        </template>
    </Dialog>
</template>
