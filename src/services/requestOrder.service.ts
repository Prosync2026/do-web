// src/services/requestOrder.service.ts
import type { ApiErrorResponse } from '@/types/api.type';
import type { ApiResponse, AttachmentItem, CreateRequestOrderPayload, CreateRequestOrderResponse, GetRequestOrdersParams, GetRequestOrdersResponse } from '@/types/request-order.type';
import { ApprovalRole, USER_ROLE_TO_APPROVAL_ROLE, UserRole } from '@/utils/approvalRole.util';
import { showError } from '@/utils/showNotification.utils';
import type { AxiosError } from 'axios';
import { isRef, unref } from 'vue';
import axiosInstance from './backendAxiosInstance';

/**
 * Append file attachments to FormData
 */
function appendAttachmentsToFormData(formData: FormData, attachments?: Array<File | AttachmentItem>) {
    if (!attachments?.length) return;

    // Append only new File objects
    attachments.filter((att) => att instanceof File).forEach((file) => formData.append('attachment', file, file.name));

    // Append existing attachments as JSON if any
    const existing = attachments.filter((att) => !(att instanceof File));
    if (existing.length) {
        formData.append('existingAttachments', JSON.stringify(existing));
    }
}

/**
 * Type guard for AttachmentItem
 */
function isAttachmentItem(obj: unknown): obj is AttachmentItem {
    return obj != null && typeof (obj as AttachmentItem).path === 'string';
}

/**
 * Create a new request order
 */
const createRequestOrder = async (payload: CreateRequestOrderPayload, attachments?: Array<File | AttachmentItem>): Promise<CreateRequestOrderResponse> => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        appendAttachmentsToFormData(formData, attachments);

        const response = await axiosInstance.post('/requestOrder', formData);
        return { success: true, data: response.data };
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to create request order';
        showError(error, message);
        return { success: false, message };
    }
};

/**
 * Update an existing request order
 */
const updateRequestOrder = async (id: string, payload: CreateRequestOrderPayload, attachments?: Array<File | AttachmentItem>): Promise<CreateRequestOrderResponse> => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        appendAttachmentsToFormData(formData, attachments);

        const response = await axiosInstance.put(`/requestOrder/${id}`, formData);
        return { success: true, data: response.data };
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to update request order';
        showError(error, message);
        return { success: false, message };
    }
};

/**
 * Create a draft request order
 */
const createRequestOrderDraft = async (payload: CreateRequestOrderPayload, attachments?: Array<File | AttachmentItem>): Promise<CreateRequestOrderResponse> => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        appendAttachmentsToFormData(formData, attachments);

        const response = await axiosInstance.post('/requestOrder/Draft', formData);
        return { success: true, data: response.data };
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to save request order as draft';
        showError(error, message);
        return { success: false, message };
    }
};

/**
 * Submit draft request order
 */
const submitDraftRequestOrder = async (draftId: string, payload: CreateRequestOrderPayload, attachments?: Array<File | AttachmentItem>): Promise<CreateRequestOrderResponse> => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        appendAttachmentsToFormData(formData, attachments);

        const response = await axiosInstance.put(`/requestOrder/${draftId}/submit`, formData);
        return { success: true, data: response.data };
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to submit draft request order';
        showError(error, message);
        return { success: false, message };
    }
};

/**
 * Delete request order
 */
const deleteRequestOrder = async (id: number): Promise<void> => {
    try {
        await axiosInstance.delete(`/requestOrder/${id}`);
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to delete request order';
        showError(error, message);
        throw error;
    }
};

// get status approval
const getROApprovalStatus = async (id: number | string) => {
    try {
        const response = await axiosInstance.get(`/roApproval/${id}/status`);
        return response.data.data;
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to fetch approval status';
        showError(error, message);
        throw error;
    }
};

/**
 * Process RO approval (approve / reject)
 */
type ApprovalAction = 'Approved' | 'Rejected';

const processROApproval = async (id: number | string, action: ApprovalAction, userRole: UserRole, remark?: string) => {
    try {
        // check status first
        const status = await getROApprovalStatus(id);

        const approvalRole = USER_ROLE_TO_APPROVAL_ROLE[userRole];

        if (status.currentStage !== approvalRole) {
            throw new Error(`RO is currently pending ${status.currentStage} approval`);
        }

        // resolve endpoint by role
        const endpointMap: Record<ApprovalRole, string> = {
            PM: 'pm',
            PD: 'pd',
            PURCH: 'purch'
        };

        const endpoint = endpointMap[approvalRole];

        // call correct approval endpoint
        const response = await axiosInstance.post(`/roApproval/${id}/${endpoint}`, { action, remark });

        return { success: true, data: response.data };
    } catch (error: unknown) {
        const apiError = error as AxiosError<ApiErrorResponse>;

        const message = apiError?.response?.data?.error || apiError?.response?.data?.message || (error as Error)?.message || `Failed to ${action.toLowerCase()} request order`;

        showError(error, message);
        throw error;
    }
};

/**
 * Fetch request orders with optional params
 */
const getRequestOrders = async (params?: GetRequestOrdersParams): Promise<GetRequestOrdersResponse> => {
    try {
        const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key as keyof GetRequestOrdersParams] = value;
            }
            return acc;
        }, {} as GetRequestOrdersParams);

        const response = await axiosInstance.get('/requestOrder', { params: cleanParams });

        const orders: CreateRequestOrderPayload[] = response.data.data || [];

        const counts = {
            pending: orders.filter((o) => o['Status'] === 'Processing').length,
            submitted: orders.filter((o) => o['Status'] === 'Submitted').length,
            approved: orders.filter((o) => o['Status'] === 'Approved').length,
            rejected: orders.filter((o) => o['Status'] === 'Rejected').length,
            totalValue: orders.reduce((sum, o) => sum + Number(o['TotalAmount'] || 0), 0),
            totalApprovedValue: response.data.totalApprovedValue || 0
        };

        return {
            success: response.data.success,
            data: orders,
            pagination: response.data.pagination || { total: 0, totalPages: 0, page: 1, pageSize: 10 },
            counts,
            totalApprovedValue: response.data.totalApprovedValue || 0
        };
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to fetch request orders';
        showError(error, message);
        return {
            success: false,
            data: [],
            pagination: { total: 0, totalPages: 0, page: 1, pageSize: 10 },
            counts: { pending: 0, approved: 0, rejected: 0, submitted: 0, totalValue: 0, totalApprovedValue: 0 }
        };
    }
};

/**
 * Fetch a request order by ID
 */
const getRequestOrderById = async (id: string): Promise<ApiResponse<CreateRequestOrderPayload>> => {
    try {
        const response = await axiosInstance.get(`/requestOrder/${id}`);
        console.log('Request order details response:', response.data);

        return response.data;
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>).response?.data?.message || 'Failed to fetch request order details';
        showError(error, message);
        throw error;
    }
};

/**
 * Attachment helper
 */
const getAttachmentUrl = (file: AttachmentItem): string => {
    return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/${file.path.replace(/\\/g, '/')}`;
};

const previewAttachment = (file: AttachmentItem | unknown) => {
    const rawFile = isRef(file) ? unref(file) : file;
    if (!isAttachmentItem(rawFile)) return;
    const url = getAttachmentUrl(rawFile);
    window.open(url, '_blank');
};

const downloadAttachment = async (file: AttachmentItem | unknown) => {
    const rawFile = isRef(file) ? unref(file) : file;
    if (!isAttachmentItem(rawFile)) return;

    try {
        const url = getAttachmentUrl(rawFile);
        const response = await axiosInstance.get(url, { responseType: 'blob' });
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', rawFile.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || `Failed to download attachment ${rawFile.filename}`;
        showError(error, message);
    }
};

const getAttachmentsByROId = async (requestOrderId: number | string): Promise<AttachmentItem[]> => {
    try {
        const response = await axiosInstance.get(`/requestOrder/${requestOrderId}/attachments`);
        return response.data.data || [];
    } catch (error: unknown) {
        const message = (error as AxiosError<{ message: string }>)?.response?.data?.message || `Failed to fetch attachments for RO ${requestOrderId}`;
        showError(error, message);
        return [];
    }
};

/**
 * Export service
 */
export const requestOrderService = {
    createRequestOrder,
    updateRequestOrder,
    createRequestOrderDraft,
    deleteRequestOrder,
    getRequestOrders,
    getRequestOrderById,
    submitDraftRequestOrder,
    processROApproval,
    getAttachmentUrl,
    downloadAttachment,
    previewAttachment,
    getAttachmentsByROId,
    getROApprovalStatus
};
