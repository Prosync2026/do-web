import axiosInstance from '@/services/backendAxiosInstance';
import type { PermissionResponse } from '@/types/permission.type';
import { showError } from '@/utils/showNotification.utils';

function getAxiosErrorMessage(error: unknown, fallback = 'Failed to load permissions'): string {
    if (typeof error === 'object' && error !== null) {
        const err = error as any;
        if (err.response?.data?.message) return err.response.data.message;
    }
    return fallback;
}

const getPermissions = async (): Promise<PermissionResponse> => {
    try {
        const client_id = 1;
        const response = await axiosInstance.get<PermissionResponse>('/api/permissions?client_id=' + client_id);
        return response.data;
    } catch (error) {
        const message = getAxiosErrorMessage(error);
        showError(error, message);
        return {
            message: message,
            data: [],
            error
        };
    }
};

export const permissionService = {
    getPermissions
};
