import { defineComponent, reactive } from 'vue';

interface TableRow {
    element: string;
    subElement: string;
    subSubElement: string;
    backchargePotential: string;
    selected: boolean;
}

export default defineComponent({
    name: 'CreateCostCenter',
    props: {
        visible: { type: Boolean, required: true }
    },
    emits: ['update:visible', 'submit'],
    setup(props, { emit }) {
        const close = () => emit('update:visible', false);

        const tableData = reactive<TableRow[]>([
            { element: 'Element1', subElement: 'Sub1', subSubElement: 'SubSub1', backchargePotential: 'Yes', selected: false },
            { element: 'Element2', subElement: 'Sub2', subSubElement: 'SubSub2', backchargePotential: 'No', selected: false },
            { element: 'Element3', subElement: 'Sub3', subSubElement: 'SubSub3', backchargePotential: 'Yes', selected: false },
            { element: 'Element4', subElement: 'Sub4', subSubElement: 'SubSub4', backchargePotential: 'No', selected: false },
            { element: 'Element5', subElement: 'Sub5', subSubElement: 'SubSub5', backchargePotential: 'Yes', selected: false },
            { element: 'Element6', subElement: 'Sub6', subSubElement: 'SubSub6', backchargePotential: 'No', selected: false }
        ]);

        const handleSubmit = () => {
            const selectedRows = tableData.filter((row) => row.selected);

            emit('submit', selectedRows);
            close();
        };

        return {
            tableData,
            handleSubmit,
            close
        };
    }
});
