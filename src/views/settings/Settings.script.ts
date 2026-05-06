import { PhCpu, PhFloppyDisk } from '@phosphor-icons/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';
import { useToast } from '@/utils/toastBus';
import { onMounted, ref } from 'vue';

// The default token currently hardcoded in the system as fallback
const DEFAULT_TOKEN = 'rcp_220PbLHcagDht8COyx0Sg_adC5rTXSfR6zONZib2FpCqm0CVuMz-TtIK-55xdHda';
export const SMART_SCAN_TOKEN_KEY = 'smart_scan_api_token';

export default {
    components: { Card, InputText, Button, Toast, PhCpu, PhFloppyDisk },
    setup() {
        const toast = useToast();
        const token = ref('');
        const isLoading = ref(false);
        const isTokenVisible = ref(false);

        onMounted(() => {
            const savedToken = localStorage.getItem(SMART_SCAN_TOKEN_KEY);
            token.value = savedToken || DEFAULT_TOKEN;
        });

        const toggleVisibility = () => {
            isTokenVisible.value = !isTokenVisible.value;
        };

        const saveToken = async () => {
            if (!token.value.trim()) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Token cannot be empty.', life: 3000 });
                return;
            }

            isLoading.value = true;
            
            try {
                // Mock API delay to simulate backend request
                await new Promise((resolve) => setTimeout(resolve, 600));
                
                // Save locally
                localStorage.setItem(SMART_SCAN_TOKEN_KEY, token.value.trim());

                toast.add({ severity: 'success', summary: 'Success', detail: 'Smart Scan API Token updated successfully.', life: 3000 });
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update token.', life: 3000 });
            } finally {
                isLoading.value = false;
            }
        };

        return {
            token,
            isLoading,
            isTokenVisible,
            saveToken,
            toggleVisibility
        };
    }
};
