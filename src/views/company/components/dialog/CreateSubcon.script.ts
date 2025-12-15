import { defineComponent, reactive } from 'vue';

interface ContactPerson {
    name: string;
    email: string;
    contactNumber: string;
    selected: boolean;
}

interface Information {
    name: string;
    shortCode: string;
    faxNumber: string;
    regNo: string;
    gstId: string;
    address1: string;
    address2: string;
    address3: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    contacts: ContactPerson[];
}

export default defineComponent({
    name: 'CreateInformationModal',
    props: {
        visible: { type: Boolean, required: true }
    },
    emits: ['update:visible', 'submit'],
    setup(props, { emit }) {
        const close = () => emit('update:visible', false);

        const form = reactive<Information>({
            name: '',
            shortCode: '',
            faxNumber: '',
            regNo: '',
            gstId: '',
            address1: '',
            address2: '',
            address3: '',
            city: '',
            state: '',
            postcode: '',
            country: '',
            contacts: [{ name: '', email: '', contactNumber: '', selected: false }]
        });

        const addContact = () => {
            if (form.contacts.length < 3) {
                form.contacts.push({ name: '', email: '', contactNumber: '', selected: false });
            }
        };

        const handleSubmit = () => {
            const selectedContacts = form.contacts.filter((c) => c.selected);

            emit('submit', { ...form, selectedContacts });
            close();
        };

        return { form, handleSubmit, close, addContact };
    }
});
