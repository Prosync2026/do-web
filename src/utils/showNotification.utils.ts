export interface ToastServiceMethods {
    add: (options: { severity?: string; summary?: string; detail?: string; life?: number }) => void;
    removeAll?: () => void;
}

let globalToast: ToastServiceMethods | null = null;

export function setGlobalToast(toastInstance: ToastServiceMethods) {
    globalToast = toastInstance;
}

export function getGlobalToast() {
    return globalToast;
}

export function showSuccess(message?: string, fallbackMessage = 'Success.') {
    const toast = getGlobalToast();

    if (!toast) {
        console.warn('⚠️ Toast not initialized');
        return;
    }

    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: message || fallbackMessage,
        life: 2000
    });
}

export function showError(error: any, fallbackMessage = 'Something went wrong.') {
    const toast = getGlobalToast();

    if (!toast) {
        console.warn('⚠️ Toast not initialized');
        return;
    }

    const message = error?.response?.data?.message || error?.message || error?.error || fallbackMessage;

    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 2000
    });

    return message;
}

export function showInfo(message?: string, fallbackMessage = 'Info.') {
    const toast = getGlobalToast();

    if (!toast) {
        console.warn('⚠️ Toast not initialized');
        return;
    }

    toast.add({
        severity: 'info',
        summary: 'info',
        detail: message || fallbackMessage,
        life: 2000
    });
}
