import { PhTrash, PhCaretRight, PhPlus, PhCheck } from '@phosphor-icons/vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import { computed, defineComponent, ref, watch } from 'vue';

interface RoleStep {
    role: string;
}

export default defineComponent({
    name: 'EditApprovalFlowModal',
    components: { Button, Dialog, Dropdown, PhTrash, PhCaretRight, PhPlus, PhCheck },
    props: {
        modelValue: {
            type: Boolean,
            required: true
        }
    },
    emits: ['update:modelValue', 'save'],
    setup(props, { emit }) {
        const allRoles = [
            { label: 'PM', value: 'PM' },
            { label: 'PD', value: 'PD' },
            { label: 'MNGT', value: 'MNGT' },
            { label: 'PURC', value: 'PURC' },
            { label: 'QS', value: 'QS' },
            { label: 'SITE', value: 'SITE' }
        ];

        const localSteps = ref<RoleStep[]>([{ role: 'PM' }, { role: 'PD' }, { role: 'QS' }]);
        const selectedRole = ref<string | null>(null);

        const visible = ref(props.modelValue);

        watch(
            () => props.modelValue,
            (val) => {
                visible.value = val;
            }
        );

        const availableRoles = computed(() => allRoles.filter((r) => !localSteps.value.some((step) => step.role === r.value)));

        const addStep = (): void => {
            if (!selectedRole.value) return;
            localSteps.value.push({ role: selectedRole.value });
            selectedRole.value = null;
        };

        const removeStep = (index: number): void => {
            localSteps.value.splice(index, 1);
        };

        const close = (): void => {
            emit('update:modelValue', false);
        };

        const save = (): void => {
            console.log('Updated approval flow:', localSteps.value);
            emit('save', localSteps.value);
            emit('update:modelValue', false);
        };

        return {
            visible,
            localSteps,
            selectedRole,
            availableRoles,
            addStep,
            removeStep,
            close,
            save
        };
    }
});
