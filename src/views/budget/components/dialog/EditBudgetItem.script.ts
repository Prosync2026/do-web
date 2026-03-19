import { useBudgetStore } from '@/stores/budget/budget.store';
import { showSuccess, showWarning } from '@/utils/showNotification.utils';
import { computed, defineComponent, reactive, ref, watch } from 'vue';

export default defineComponent({
    name: 'EditBudgetItem',

    props: {
        visible: {
            type: Boolean,
            required: true
        },
        item: {
            type: Object,
            default: null
        }
    },

    emits: ['update:visible', 'success'],

    setup(props, { emit }) {
        const budgetStore = useBudgetStore();
        const submitting = ref(false);
        const localVisible = ref(props.visible);

        watch(
            () => props.visible,
            (val) => {
                localVisible.value = val;
            }
        );

        const defaultForm = () => ({
            ItemCode: '',
            Description: '',
            Description2: '',
            Category: '',
            Location1: '',
            Location2: '',
            Element: '',
            SubElement: '',
            SubSubElement: '',
            Unit: '',
            Quantity: 0,
            Rate: 0,
            Wastage: 0
        });

        const form = reactive(defaultForm());
        const errors = reactive<Record<string, string>>({});

        // Tracks what the original DB values were when modal opened
        const originalValues = ref<Record<string, any>>({});

        // Pre-fill form whenever item changes (modal opens with new row)
        watch(
            () => props.item,
            (newItem) => {
                if (newItem) {
                    const filled = {
                        ItemCode: newItem.itemCode ?? '',
                        Description: newItem.description ?? '',
                        Description2: newItem.description2 ?? '',
                        Category: newItem.category ?? '',
                        Location1: newItem.location1 ?? '',
                        Location2: newItem.location2 ?? '',
                        Element: newItem.elementCode ?? '',
                        SubElement: newItem.subElement ?? '',
                        SubSubElement: newItem.subSubElement ?? '',
                        Unit: newItem.unit ?? '',
                        Quantity: newItem.qty ?? 0,
                        Rate: newItem.rate ?? 0,
                        Wastage: newItem.wastage ?? 0
                    };
                    Object.assign(form, filled);
                    // Snapshot original values so validation knows what was pre-existing
                    originalValues.value = { ...filled };
                    // Clear errors on new item
                    Object.keys(errors).forEach((k) => delete errors[k]);
                }
            },
            { immediate: true }
        );

        const computedAmount = computed(() => (form.Quantity ?? 0) * (form.Rate ?? 0));

        // Only validate a text field as required if it originally had a value
        // (prevents blocking save when existing DB record has empty fields)
        const requireIfHadValue = (field: string, currentValue: string, errorKey: string, label: string) => {
            if (originalValues.value[field] && !currentValue) {
                errors[errorKey] = `${label} is required`;
            }
        };

        // Number version: original must have been > 0, and current must still be > 0
        const requireNumberIfHadValue = (field: string, currentValue: number, errorKey: string, label: string) => {
            if ((originalValues.value[field] ?? 0) > 0 && (currentValue ?? 0) <= 0) {
                errors[errorKey] = `${label} must be greater than 0`;
            }
        };

        const validate = () => {
            Object.keys(errors).forEach((k) => delete errors[k]);

            requireIfHadValue('ItemCode', form.ItemCode, 'ItemCode', 'Item Code');
            requireIfHadValue('Description', form.Description, 'Description', 'Description');
            requireIfHadValue('Category', form.Category, 'Category', 'Category');
            requireIfHadValue('Location1', form.Location1, 'Location1', 'Location 1');
            requireIfHadValue('Element', form.Element, 'Element', 'Element');
            requireIfHadValue('SubElement', form.SubElement, 'SubElement', 'Sub Element');
            requireIfHadValue('Unit', form.Unit, 'Unit', 'Unit');

            // Qty and Rate are always required
            if ((form.Quantity ?? 0) <= 0) errors.Quantity = 'Quantity must be greater than 0';
            if ((form.Rate ?? 0) <= 0) errors.Rate = 'Rate must be greater than 0';

            return Object.keys(errors).length === 0;
        };

        const close = () => {
            Object.assign(form, defaultForm());
            Object.keys(errors).forEach((k) => delete errors[k]);
            emit('update:visible', false);
        };

        const submit = async () => {
            if (!validate()) {
                Object.values(errors).forEach((msg) => showWarning(msg));
                return;
            }

            // hanlde both camelCase and PascalCase ID properties to be safe
            const itemId = props.item?.id ?? props.item?.Id;
            if (!itemId) {
                showWarning('Cannot determine item ID. Please try again.');
                return;
            }

            submitting.value = true;
            try {
                const result = await budgetStore.updateBudgetItem(itemId, {
                    ItemCode: form.ItemCode,
                    Description: form.Description,
                    Description2: form.Description2,
                    Category: form.Category,
                    Location1: form.Location1,
                    Location2: form.Location2,
                    Element: form.Element,
                    SubElement: form.SubElement,
                    SubSubElement: form.SubSubElement,
                    Unit: form.Unit,
                    Quantity: form.Quantity,
                    Rate: form.Rate,
                    Amount: computedAmount.value,
                    Wastage: form.Wastage
                });

                if (result?.success) {
                    showSuccess('Budget item updated successfully.');
                    emit('success');
                    close();
                }
            } finally {
                submitting.value = false;
            }
        };

        return {
            form,
            errors,
            submitting,
            localVisible,
            computedAmount,
            close,
            submit
        };
    }
});
