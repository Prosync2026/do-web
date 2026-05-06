import ReusableTable from '@/components/table/ReusableTable.vue';
import type { TableColumn } from '@/types/table.type';

import CreateSubconModal from '@/views/company/components/dialog/CreateSubcon.vue';
import { useToast } from '@/utils/toastBus';
import { defineComponent, ref } from 'vue';

export default defineComponent({
    name: 'SubconElement',
    components: { ReusableTable, CreateSubconModal },
    setup() {
        const toast = useToast();

        const columns: TableColumn[] = [
            { field: 'no', header: 'No' },
            { field: 'name', header: 'Name' },
            { field: 'regNo', header: 'Reg No' },
            { field: 'shortCode', header: 'Short Code' },
            { header: 'Action', action: true, actions: ['edit', 'delete'] }
        ];

        const subconList = ref([
            { no: 1, name: 'ABC Construction', regNo: 'REG123', shortCode: 'ABC' },
            { no: 2, name: 'XYZ Engineering', regNo: 'REG456', shortCode: 'XYZ' }
        ]);

        const showCreateModal = ref(false);

        const handleCreate = () => {
            showCreateModal.value = true;
        };

        const handleModalSubmit = (newItems: any[]) => {
            if (newItems.length) {
                newItems.forEach((item) => {
                    item.no = subconList.value.length + 1;
                    subconList.value.push(item);
                });
                toast.add({ severity: 'success', summary: 'Created', detail: 'New subcons added successfully.', life: 2000 });
            }
            showCreateModal.value = false;
        };

        const handleActionClick = (type: string, row: any) => {
            if (type === 'delete') {
                subconList.value = subconList.value.filter((item) => item.no !== row.no);
                toast.add({ severity: 'warn', summary: 'Deleted', detail: `${row.name} has been deleted.`, life: 2000 });
            } else if (type === 'edit') {
                showCreateModal.value = true;
            }
        };

        return { columns, subconList, handleCreate, handleModalSubmit, handleActionClick, showCreateModal };
    }
});
