import { PhPencil, PhCaretRight, PhX, PhCheck } from '@phosphor-icons/vue';
import UpdateApprovalRoles from '@/views/project/components/dialog/UpdateApprovalRoles.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { defineComponent, ref } from 'vue';

interface Props {
    visible: boolean;
    title?: string;
}

interface ApprovalStep {
    role: string;
    users: string[];
}

export default defineComponent({
    name: 'ProjectRolesModal',
    components: { Dialog, Button, UpdateApprovalRoles, PhPencil, PhCaretRight, PhX, PhCheck },
    props: {
        visible: {
            type: Boolean,
            required: true
        },
        title: {
            type: String,
            required: false
        }
    },
    emits: ['close'],
    setup(props: Props, { emit }) {
        const approvalSteps = ref<ApprovalStep[]>([
            { role: 'PM', users: ['Alice', 'Bob'] },
            { role: 'PD', users: ['ZIYU'] },
            { role: 'QS', users: [] }
        ]);

        const showUpdateRoles = ref(false);

        const openUpdateRoles = () => {
            showUpdateRoles.value = true;
        };

        const close = () => {
            emit('close');
        };

        const save = () => {
            emit('close');
        };

        return {
            approvalSteps,
            showUpdateRoles,
            openUpdateRoles,
            close,
            save
        };
    }
});
