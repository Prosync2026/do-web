import ReusableTable from '@/components/table/ReusableTable.vue';
import type { TableColumn } from '@/types/table.type';

import CreateCostCenterModal from '@/views/company/components/dialog/CreateCostCenter.vue';
import { useToast } from '@/utils/toastBus';
import { defineComponent, ref } from 'vue';

export default defineComponent({
    name: 'CostCenterElement',
    components: { ReusableTable, CreateCostCenterModal },
    setup() {
        const toast = useToast();

        const columns: TableColumn[] = [
            { field: 'no', header: 'No' },
            { field: 'mainElement', header: 'Main Element' },
            { field: 'firstSubElement', header: '1st Sub Element' },
            { field: 'secondSubElement', header: '2nd Sub Element' },
            { field: 'backchargePotential', header: 'Backcharge Potential' },
            { header: 'Action', action: true, actions: ['delete'] }
        ];

        const costCenterList = ref([
            {
                no: 1,
                mainElement: 'Electrical',
                firstSubElement: 'Wiring',
                secondSubElement: 'Lighting',
                backchargePotential: 'Yes'
            }
        ]);

        const showCreateModal = ref(false);

        const handleCreate = () => {
            showCreateModal.value = true;
        };

        const handleModalSubmit = (newItems: any[]) => {
            if (newItems.length) {
                newItems.forEach((item) => {
                    item.no = costCenterList.value.length + 1;
                    costCenterList.value.push(item);
                });
                toast.add({ severity: 'success', summary: 'Created', detail: 'New elements added successfully.', life: 2000 });
            }
            showCreateModal.value = false;
        };

        const handleActionClick = (type: string, row: any) => {
            if (type === 'delete') {
            }
        };

        return { columns, costCenterList, handleCreate, handleModalSubmit, handleActionClick, showCreateModal };
    }
});
