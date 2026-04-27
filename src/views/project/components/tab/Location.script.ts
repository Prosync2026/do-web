import { PhFile, PhImage, PhUpload, PhCheck } from '@phosphor-icons/vue';
import LocationItem from '@/views/project/components/page/PreviewLocation.vue';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { defineComponent, ref } from 'vue';

interface Location {
    name: string;
    children?: Record<string, Location>;
}

export default defineComponent({
    name: 'LocationPreviewSetup',
    components: { Button, Dropdown, InputText, LocationItem, PhFile, PhImage, PhUpload, PhCheck },
    setup() {
        const exportContent = ref<HTMLElement | null>(null);
        const selectedLevel = ref<number | null>(null);
        const selectedParents = ref<{ location_1?: string }>({});
        const newLocationName = ref('');

        const levelOptions = [
            { label: 'Location 1', value: 1 },
            { label: 'Location 2', value: 2 }
        ];
        const locationOptions = ref<{ location_1: string[] }>({
            location_1: ['Location 1A', 'Location 1B']
        });

        const groupedLocations = ref<Location[]>([
            {
                name: 'Location 1',
                children: {
                    a: { name: 'Sub Location 1-1', children: { a1: { name: 'Sub Sub 1-1-1' } } },
                    b: { name: 'Sub Location 1-2' }
                }
            },
            { name: 'Location 2' }
        ]);

        const triggerFileInput = () => {
            (document.querySelector('input[type=file]') as HTMLInputElement).click();
        };

        const importCSV = (e: Event) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files[0]) {
                console.log('Import CSV:', files[0].name);
            }
        };

        const submitForm = () => {
            if (!selectedLevel.value || !newLocationName.value) return;

            const level = selectedLevel.value;

            if (level === 1) {
                groupedLocations.value.push({ name: newLocationName.value });

                locationOptions.value.location_1.push(newLocationName.value);
            } else if (level === 2 && selectedParents.value.location_1) {
                const parentName = selectedParents.value.location_1;
                const parentNode = groupedLocations.value.find((loc) => loc.name === parentName);
                if (parentNode) {
                    if (!parentNode.children) parentNode.children = {};
                    const key = `child_${Date.now()}`;
                    parentNode.children[key] = { name: newLocationName.value };
                }
            }

            newLocationName.value = '';
            selectedLevel.value = null;
            selectedParents.value = {};
        };

        const downloadCSV = () => console.log('Download CSV');
        const exportImage = () => console.log('Export Image');

        const handleLocationSelection = (key: 'location_1') => {
            console.log('Selected parent for', key, selectedParents.value[key]);
        };

        return {
            exportContent,
            selectedLevel,
            selectedParents,
            newLocationName,
            levelOptions,
            locationOptions,
            groupedLocations,
            triggerFileInput,
            importCSV,
            submitForm,
            downloadCSV,
            exportImage,
            handleLocationSelection
        };
    }
});
