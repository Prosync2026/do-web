// src/services/newBudget.service.ts
import type { GetBudgetsParams, GetBudgetsResponse, Pagination } from '@/types/newBudget.type';
import { showError } from '@/utils/showNotification.utils';
import axiosInstance from './backendAxiosInstance';

export const mapPagination = (p: any): Pagination => ({
    total: p?.total ?? p?.totalBudgetItems ?? 0,
    totalPages: p?.totalPages ?? 1,
    page: p?.page ?? 1,
    pageSize: p?.pageSize ?? 10
});

const cleanParams = (params?: Record<string, any>) => {
    return Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') acc[key] = value;
            return acc;
        },
        {} as Record<string, any>
    );
};

const getBudgets = async (params?: GetBudgetsParams): Promise<GetBudgetsResponse> => {
    try {
        const response = await axiosInstance.get('/budgets', { params: cleanParams(params) });
        return {
            success: response.data.success,
            data: response.data.data || [],
            pagination: mapPagination(response.data.pagination)
        };
    } catch (error: any) {
        showError(error, 'Failed to fetch budgets.');
        return { success: false, data: [], pagination: { total: 0, totalPages: 0, page: 1, pageSize: 10 } };
    }
};

const getBudgetItems = async (params?: GetBudgetsParams): Promise<GetBudgetsResponse> => {
    try {
        const response = await axiosInstance.get('/budget/items', { params: cleanParams(params) });
        return {
            success: response.data.success,
            data: response.data.data || [],
            pagination: mapPagination(response.data.pagination)
        };
    } catch (error: any) {
        showError(error, 'Failed to fetch budget items.');
        return { success: false, data: [], pagination: { total: 0, totalPages: 0, page: 1, pageSize: 10 } };
    }
};

const getBudgetVersion = async (params?: GetBudgetsParams): Promise<GetBudgetsResponse> => {
    try {
        const response = await axiosInstance.get<GetBudgetsResponse>('/budgets', { params });
        return response.data;
    } catch (error) {
        showError(error, 'Failed to fetch budget version list.');
        throw error;
    }
};

const createBudget = async (formData: FormData) => {
    try {
        for (const [key, value] of formData.entries()) {
        }

        const response = await axiosInstance.post('/budgets/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('Budget Upload Error:', error.response?.data || error);
        return {
            success: false,
            message: error.response?.data?.message || error.response?.data?.error || 'Upload failed'
        };
    }
};

export const budgetService = { getBudgets, getBudgetItems, getBudgetVersion, createBudget };
