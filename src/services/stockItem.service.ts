import { showError } from '@/utils/showNotification.utils';
import axiosInstance from './backendAxiosInstance';

const cleanParams = (params?: Record<string, any>) =>
    Object.entries(params || {}).reduce(
        (acc, [k, v]) => {
            if (v !== undefined && v !== null && v !== '') acc[k] = v;
            return acc;
        },
        {} as Record<string, any>
    );

export const getStockItems = async (params?: { page?: number; pageSize?: number; category?: string; itemType?: string; itemGroup?: string; itemCategory?: string; element?: string }) => {
    try {
        const res = await axiosInstance.get('/stockItem', {
            params: cleanParams(params)
        });

        return {
            success: res.data.success,
            data: res.data.data || [],
            pagination: {
                total: res.data.pagination?.totalStockItems ?? 0,
                totalPages: res.data.pagination?.totalPages ?? 1,
                page: res.data.pagination?.page ?? 1,
                pageSize: res.data.pagination?.pageSize ?? 10
            }
        };
    } catch (error: any) {
        showError(error, 'Failed to fetch stock items');
        return {
            success: false,
            data: [],
            pagination: { total: 0, totalPages: 0, page: 1, pageSize: 10 }
        };
    }
};
