import { PhPlus, PhTrash, PhCheck } from '@phosphor-icons/vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import { defineComponent, ref, watch } from 'vue';

interface Assignment {
    role: string;
    user: string;
}

export default defineComponent({
    name: 'AssignRoles',
    components: { Dialog, Dropdown, Button, PhPlus, PhTrash, PhCheck },
    props: {
        modelValue: { type: Boolean, required: true }
    },
    emits: ['update:modelValue', 'save'],
    setup(props, { emit }) {
        const visible = ref(props.modelValue);

        watch(
            () => props.modelValue,
            (val) => {
                visible.value = val;
            }
        );

        const roles = [
            { label: 'PURC', value: 'PURC' },
            { label: 'QS', value: 'QS' },
            { label: 'SITE', value: 'SITE' },
            { label: 'PD', value: 'PD' },
            { label: 'PM', value: 'PM' },
            { label: 'MNGT', value: 'MNGT' }
        ];

        const users = [
            { label: 'Alice', value: 'Alice' },
            { label: 'Bob', value: 'Bob' },
            { label: 'Charlie', value: 'Charlie' },
            { label: 'ZIYU', value: 'ZIYU' }
        ];

        const selectedRole = ref<string | null>(null);
        const selectedUser = ref<string | null>(null);
        const assignments = ref<Assignment[]>([]);

        const addAssignment = () => {
            if (!selectedRole.value || !selectedUser.value) return;
            if (assignments.value.some((a) => a.role === selectedRole.value && a.user === selectedUser.value)) return;
            assignments.value.push({ role: selectedRole.value, user: selectedUser.value });
            selectedRole.value = null;
            selectedUser.value = null;
        };

        const removeAssignment = (index: number) => {
            assignments.value.splice(index, 1);
        };

        const close = () => {
            emit('update:modelValue', false);
        };

        const save = () => {
            emit('save', assignments.value);
            emit('update:modelValue', false);
        };

        return {
            visible,
            roles,
            users,
            selectedRole,
            selectedUser,
            assignments,
            addAssignment,
            removeAssignment,
            close,
            save
        };
    }
});
