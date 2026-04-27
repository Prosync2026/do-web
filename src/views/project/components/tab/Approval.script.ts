import { PhFilePlus } from '@phosphor-icons/vue';
import AssignApproval from '@/views/project/components/dialog/AssignApproval.vue';
import Card from 'primevue/card';
import { defineComponent, ref } from 'vue';
interface Person {
    name: string;
    role: string;
}

export default defineComponent({
    name: 'RequestSummaryCards',
    components: { Card, AssignApproval, PhFilePlus },
    setup() {
        const budgetChangeList = ref<Person[]>([
            { name: 'ZIYU', role: 'PM' },
            { name: 'ALICE', role: 'PD' },
            { name: 'KELVIN', role: 'QS' }
        ]);

        const requestOrderList = ref<Person[]>([
            { name: 'BRYAN', role: 'PD' },
            { name: 'CINDY', role: 'PM' }
        ]);

        const exceededBudgetList = ref<Person[]>([
            { name: 'DAVID', role: 'MNGT' },
            { name: 'EMMA', role: 'PM' },
            { name: 'LIAM', role: 'PURC' }
        ]);

        const showProjectRolesModal = ref(false);
        const onAssignRoles = (): void => {
            showProjectRolesModal.value = true;
        };

        const closeModal = (): void => {
            showProjectRolesModal.value = false;
        };

        return {
            budgetChangeList,
            requestOrderList,
            exceededBudgetList,
            showProjectRolesModal,
            closeModal,
            onAssignRoles
        };
    }
});
