// src/services/deliveryOrder.service.ts
import axiosInstance from '@/services/backendAxiosInstance';
import type { DeliveryOrderResponse, SingleDeliveryOrderResponse } from '@/types/delivery.type';
import type { AttachmentItem } from '@/types/request-order.type';
import { showError } from '@/utils/showNotification.utils';

export interface GetDeliveryOrderParams {
    status?: string;
    search?: string;
    projectId?: number;
}

const getDeliveryOrders = async (params?: GetDeliveryOrderParams): Promise<DeliveryOrderResponse> => {
    try {
        const response = await axiosInstance.get<DeliveryOrderResponse>('/deliveryOrder', { params });
        return response.data;
    } catch (error) {
        showError(error, 'Failed to fetch delivery orders.');
        throw error;
    }
};

const createDeliveryOrder = async (formData: FormData): Promise<DeliveryOrderResponse> => {
    try {
        const response = await axiosInstance.post('/deliveryOrder', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error: any) {
        showError(error, 'Failed to create delivery order.');
        return {
            success: false,
            data: [],
            message: error.response?.data?.message || error.response?.data?.error || 'Failed to create delivery order'
        };
    }
};

const getSingleDeliveryOrder = async (deliveryId: number): Promise<SingleDeliveryOrderResponse> => {
    try {
        const response = await axiosInstance.get<SingleDeliveryOrderResponse>(`/deliveryOrder/${deliveryId}`);
        return response.data;
    } catch (error) {
        showError(error, 'Failed to fetch single by delivery order.');
        throw error;
    }
};

const getAttachmentsByDeliveryId = async (deliveryOrderId: number | string): Promise<AttachmentItem[]> => {
    try {
        const response = await axiosInstance.get(`/deliveryOrder/${deliveryOrderId}/attachments`);
        return response.data.data || [];
    } catch (error) {
        showError(error, `Failed to fetch attachments for Delivery Order ${deliveryOrderId}`);
        return [];
    }
};

export const deliveryOrderService = {
    getDeliveryOrders,
    createDeliveryOrder,
    getSingleDeliveryOrder,
    getAttachmentsByDeliveryId
};
