import { defineComponent, reactive } from 'vue';

export interface SingleBudgetItem {
    Category: string;
    Location1: string;
    Location2: string;
    Element: string;
    SubElement: string;
    SubSubElement: string;
    ItemClass: string;
    ItemType: string;
    ItemCode: string;
    Description: string;
    Description2: string;
    Unit: string;
    Quantity: number;
    Rate: number;
    Amount: number;
    Wastage: number;
}

export default defineComponent({
    name: 'CreateSingleBudgetItem',

    props: {
        visible: {
            type: Boolean,
            required: true
        }
    },

    emits: ['update:visible', 'items-value'],

    setup(props, { emit }) {
        const defaultForm = (): SingleBudgetItem => ({
            Category: '',
            Location1: '',
            Location2: '',
            Element: '',
            SubElement: '',
            SubSubElement: '',
            ItemClass: 'Material',
            ItemType: 'NewItem',
            ItemCode: '',
            Description: '',
            Description2: '',
            Unit: '',
            Quantity: 0,
            Rate: 0,
            Amount: 0,
            Wastage: 0
        });

        const form = reactive<SingleBudgetItem>(defaultForm());
        const errors = reactive<Record<string, string>>({});

        const validate = () => {
            Object.keys(errors).forEach((k) => delete errors[k]);

            if (!form.ItemCode) errors.ItemCode = 'Item Code is required';
            if (!form.Description) errors.Description = 'Description is required';
            if (!form.Category) errors.Category = 'Category is required';
            if (!form.Location1) errors.Location1 = 'Location 1 is required';
            if (!form.Element) errors.Element = 'Element is required';
            if (!form.Unit) errors.Unit = 'Unit is required';
            if (form.Amount <= 0) errors.Amount = 'Amount is required';

            return Object.keys(errors).length === 0;
        };

        const close = () => {
            emit('update:visible', false);
        };

        const submit = () => {
            if (!validate()) return;

            emit('items-value', { ...form });

            Object.assign(form, defaultForm());
            close();
        };

        return {
            form,
            errors,
            close,
            submit
        };
    }
});
