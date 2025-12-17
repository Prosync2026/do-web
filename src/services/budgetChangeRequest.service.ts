import axiosInstance from '@/services/backendAxiosInstance';
import type {
    BCRFinalDecisionPayload,
    BCRRecommendationEditPayload,
    BCRRecommendationPayload,
    BudgetChangeRequestPayload,
    BudgetChangeRequestResponse,
    CreateRecommendationData,
    CreateRecommendationResponse,
    HistoryResponse,
    RecommendationResponse,
    SingleBudgetChangeRequestResponse
} from '@/types/budgetChangeRequest.type';
import { showError } from '@/utils/showNotification.utils';

export interface GetBudgetParams {
    status?: string;
    page?: number;
    pageSize?: number;
    version?: string | undefined;
    projectId?: number;
}

export interface GetBudgetListParams {
    page?: number;
    pageSize?: number;
    budgetId?: number;
}

// BUDGET CHANGE REQUEST
const getBudgetChangeRequests = async (params?: GetBudgetParams): Promise<BudgetChangeRequestResponse> => {
    try {
        const response = await axiosInstance.get<BudgetChangeRequestResponse>('/budgetChange', { params });
        return response.data;
    } catch (error) {
        showError(error, 'Failed to fetch budget change request.');
        throw error;
    }
};

const createBudgetChangeRequest = async (payload: BudgetChangeRequestPayload, attachments?: File[]): Promise<BudgetChangeRequestResponse> => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        if (attachments && attachments.length > 0) {
            attachments.forEach((file) => formData.append('attachment', file, file.name));
        }

        const response = await axiosInstance.post('/budgetChange', formData);

        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('Budget Change Request Service Error:', error.response?.data || error);
        showError(error, 'Failed to create budget change request.');
        return {
            success: false,
            message: error.response?.data?.message || error.response?.data?.error || 'Failed to create budget change request'
        };
    }
};

const getSingleBudgetChangeRequest = async (bcrId: number): Promise<SingleBudgetChangeRequestResponse> => {
    try {
        const response = await axiosInstance.get<SingleBudgetChangeRequestResponse>(`/budgetChange/${bcrId}`);
        return response.data;
    } catch (error) {
        showError(error, 'Failed to fetch single by budget change request.');
        throw error;
    }
};

const editBudgetChangeRequest = async (payload: BudgetChangeRequestPayload, bcrId: number, attachments?: File[]): Promise<BudgetChangeRequestResponse> => {
    try {
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        if (attachments && attachments.length > 0) {
            attachments.forEach((file) => formData.append('attachment', file, file.name));
        }

        const response = await axiosInstance.put(`/budgetChange/${bcrId}`, formData);

        return { success: true, data: response.data };
    } catch (error: any) {
        showError(error, 'Failed to update budget change request.');
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to update budget change request'
        };
    }
};

const getBudgetChangeRequestHistory = async (budgetChangeRequestId: number): Promise<HistoryResponse> => {
    try {
        const response = await axiosInstance.get(`/budgetChange/${budgetChangeRequestId}/history`);

        return response.data ?? [];
    } catch (error) {
        showError(error, 'Failed to fetch history by budget change request.');
        throw error;
    }
};

const fetchRecommendationList = async (budgetChangeRequestId: number): Promise<RecommendationResponse> => {
    try {
        const response = await axiosInstance.get(`/budgetChange/${budgetChangeRequestId}/recommendation`);

        return response.data ?? [];
    } catch (error) {
        showError(error, 'Failed to fetch recommendation list.');
        throw error;
    }
};

const checkingUserCanCreateRecommendation = async (budgetChangeRequestId: number, department: string): Promise<boolean> => {
    try {
        const response = await axiosInstance.get(`/budgetChange/${budgetChangeRequestId}/can-recommend`, { params: { department } });

        return response.data.data.canRecommend;
    } catch (error) {
        showError(error, 'Failed to fetch recommendation list.');
        throw error;
    }
};

const createBCRRecommendation = async (budgetChangeRequestId: number, payload: BCRRecommendationPayload, attachments?: File[]): Promise<CreateRecommendationResponse> => {
    try {
        const formData = new FormData();

        formData.append('Department', payload.Department);
        formData.append('PersonInCharge', payload.PersonInCharge);
        formData.append('RecommendationType', payload.RecommendationType);
        formData.append('SpecificQuantity', payload.SpecificQuantity ? String(payload.SpecificQuantity) : '');
        formData.append('Remark', payload.Remark ?? '');

        if (attachments && attachments.length > 0) {
            attachments.forEach((file) => formData.append('files', file, file.name));
        }

        const response = await axiosInstance.post<CreateRecommendationData>(`/budgetChange/${budgetChangeRequestId}/recommendation`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

        return {
            success: true,
            message: 'Recommendation submitted successfully',
            data: response.data
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || error.response?.data?.error || 'Failed to create Recommendation.',
            data: {} as CreateRecommendationData
        };
    }
};

const editBCRRecommendation = async (budgetChangeRequestId: number, recommendationId: number, payload: BCRRecommendationEditPayload, attachments?: File[]): Promise<CreateRecommendationResponse> => {
    try {
        const formData = new FormData();

        formData.append('RecommendationType', payload.RecommendationType);
        formData.append('SpecificQuantity', payload.SpecificQuantity ? String(payload.SpecificQuantity) : '');
        formData.append('Remark', payload.Remark ?? '');

        if (attachments && attachments.length > 0) {
            attachments.forEach((file) => formData.append('files', file, file.name));
        }

        const response = await axiosInstance.put<CreateRecommendationData>(`/budgetChange/${budgetChangeRequestId}/recommendation/${recommendationId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

        return {
            success: true,
            message: 'Recommendation submitted successfully',
            data: response.data
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || error.response?.data?.error || 'Failed to create Recommendation.',
            data: {} as CreateRecommendationData
        };
    }
};

const createManagementFinalDecisionRecommendation = async (budgetChangeRequestId: number, payload: BCRFinalDecisionPayload) => {
    try {
        const response = await axiosInstance.post(`/budgetChange/${budgetChangeRequestId}/review`, payload);

        return {
            success: true,
            message: 'Final decision submitted successfully',
            data: response.data
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || error.response?.data?.error || 'Failed to submit final decision.',
            data: {}
        };
    }
};

export const budgetChangeRequestService = {
    getBudgetChangeRequests,
    createBudgetChangeRequest,
    getSingleBudgetChangeRequest,
    editBudgetChangeRequest,
    getBudgetChangeRequestHistory,
    fetchRecommendationList,
    checkingUserCanCreateRecommendation,
    createBCRRecommendation,
    editBCRRecommendation,
    createManagementFinalDecisionRecommendation
};
