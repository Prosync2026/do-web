import { ref } from 'vue';
import type { ToastType } from '@prosync_solutions/ui';

export const globalToastState = ref({
    show: false,
    type: 'information' as ToastType,
    message: '',
    duration: 3000
});

export function useToast() {
    return {
        add: (options: { severity?: string; summary?: string; detail?: string; life?: number }) => {
            let type: ToastType = 'information';
            if (options.severity === 'success') type = 'success';
            else if (options.severity === 'warn') type = 'warn';
            else if (options.severity === 'error') type = 'error';
            else if (options.severity === 'info') type = 'information';

            globalToastState.value = {
                show: true,
                type,
                message: options.detail || options.summary || '',
                duration: options.life || 3000
            };
        },
        removeAll: () => {
            globalToastState.value.show = false;
        }
    };
}
