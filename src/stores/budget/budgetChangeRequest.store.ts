import { budgetChangeRequestService } from '@/services/budgetChangeRequest.service';
import type { BCRRecommendationPayload, BudgetChangeRequest, BudgetChangeRequestPayload, HistoryList, RecommendationList } from '@/types/budgetChangeRequest.type';
import { showError, showSuccess } from '@/utils/showNotification.utils';
import { defineStore } from 'pinia';

interface State {
    loading: boolean;
    budgetChangeRequestList: BudgetChangeRequest[];
    singleBudgetChangeRequest: BudgetChangeRequest | null;
    historyList: HistoryList[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };

    filters: {
        search: string;
        status: string;
        startDate: string;
        endDate: string;
    };
}

export const useBudgetChangeRequestStore = defineStore('budgetCRStore', {
    state: (): State => ({
        loading: false,
        budgetChangeRequestList: [],
        singleBudgetChangeRequest: null,
        historyList: [],
        pagination: {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0
        },

        filters: {
            search: '',
            status: '',
            startDate: '',
            endDate: ''
        }
    }),

    actions: {
        setPage(page: number) {
            this.pagination.page = page;
            this.fetchBudgetChangesRequestList();
        },

        setPageSize(size: number) {
            this.pagination.pageSize = size;
            this.pagination.page = 1;
            this.fetchBudgetChangesRequestList();
        },

        handleSearch(value: string) {
            this.filters.search = value;
            this.pagination.page = 1;
            this.fetchBudgetChangesRequestList();
        },

        handleFilterChange(value: Record<string, any>) {
            this.filters.status = value.status ?? '';
            this.filters.startDate = value.startDate ?? '';
            this.filters.endDate = value.endDate ?? '';
            this.pagination.page = 1;
            this.fetchBudgetChangesRequestList();
        },

        async fetchBudgetChangesRequestList() {
            this.loading = true;
            try {
                const params = {
                    page: this.pagination.page,
                    pageSize: this.pagination.pageSize,
                    status: this.filters.status || undefined,
                    search: this.filters.search || undefined,
                    startDate: this.filters.startDate || undefined,
                    endDate: this.filters.endDate || undefined
                };

                const response = await budgetChangeRequestService.getBudgetChangeRequests(params);

                if (!response.success) {
                    showError(response.message || 'Failed to fetch budget change requests.');
                    return;
                }

                this.budgetChangeRequestList = response.data || [];

                if (response.pagination) {
                    this.pagination.page = response.pagination.page;
                    this.pagination.pageSize = response.pagination.pageSize;
                    this.pagination.total = response.pagination.total;
                    this.pagination.totalPages = response.pagination.totalPages;
                } else {
                    this.pagination.total = this.budgetChangeRequestList.length;
                    this.pagination.totalPages = Math.ceil(this.pagination.total / this.pagination.pageSize);
                }
            } catch (error: any) {
                showError(error?.message || 'Failed to fetch budget change requests.');
            } finally {
                this.loading = false;
            }
        },

        async createBudgetChangeRequest(payload: BudgetChangeRequestPayload) {
            this.loading = true;
            try {
                const response = await budgetChangeRequestService.createBudgetChangeRequest(payload);

                if (!response.success) {
                    showError(response.message || 'Failed to create Budget Change Request.');
                    return null;
                }

                showSuccess(response.message || 'Budget Change Request created successfully.');
                await this.fetchBudgetChangesRequestList();

                return response.data;
            } catch (error: any) {
                showError(error, 'Failed to create budget change request.');
                return null;
            } finally {
                this.loading = false;
            }
        },

        async getSingleBudgetChange(bcrId: number) {
            this.loading = true;
            try {
                const response = await budgetChangeRequestService.getSingleBudgetChangeRequest(bcrId);

                if (!response.success || !response.data) {
                    showError('Budget change request not found.');
                    this.singleBudgetChangeRequest = null;
                    return null;
                }

                this.singleBudgetChangeRequest = { ...response.data };
                return this.singleBudgetChangeRequest;
            } catch (error: any) {
                showError(error, 'Failed to fetch budget change request.');
                this.singleBudgetChangeRequest = null;
                return null;
            } finally {
                this.loading = false;
            }
        },

        async editBudgetChangeRequest(payload: BudgetChangeRequestPayload, bcrId: number) {
            this.loading = true;
            try {
                const response = await budgetChangeRequestService.editBudgetChangeRequest(payload, bcrId);

                if (!response.success) {
                    showError(response.message || 'Failed to update Budget Change Request.');
                    return null;
                }

                showSuccess(response.message || 'Budget Change Request updated successfully.');
                await this.fetchBudgetChangesRequestList();

                return response.data || true;
            } catch (error: any) {
                showError(error?.message || 'Failed to update budget change request.');
                return null;
            } finally {
                this.loading = false;
            }
        },

        async getBudgetChangeRequestActivity(budgetChangeRequestId: number) {
            this.loading = true;
            try {
                const response = await budgetChangeRequestService.getBudgetChangeRequestHistory(budgetChangeRequestId);

                this.historyList = response?.data ?? [];
            } catch (error: any) {
                showError(error, 'Failed to fetch budget change request activity log.');
                return null;
            } finally {
                this.loading = false;
            }
        },

        // RECOMMENDATION API
        async fetchRecommendationList(bcrId: number) {
            this.loading = true;

            try {
                const response = await budgetChangeRequestService.fetchRecommendationList(bcrId);

                return response.data as RecommendationList[];
            } catch (error: any) {
                showError(error, 'Failed to fetch recommendation list.');
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createBCRRecommendation(budgetChangeRequestId: number, payload: BCRRecommendationPayload, attachments?: File[]) {
            this.loading = true;
            try {
                const response = await budgetChangeRequestService.createBCRRecommendation(budgetChangeRequestId, payload, attachments);

                if (!response.success) {
                    showError(response.message || 'Failed to create Recommendation.');
                    return null;
                }

                showSuccess(response.message);
                return response.data ?? null;
            } finally {
                this.loading = false;
            }
        },

        async editBCRRecommendation(budgetChangeRequestId: number, recommendationId: number, payload: BCRRecommendationPayload, attachments?: File[]) {
            this.loading = true;
            try {
                const response = await budgetChangeRequestService.editBCRRecommendation(budgetChangeRequestId, recommendationId, payload, attachments);

                if (!response.success) {
                    showError(response.message || 'Failed to create Recommendation.');
                    return null;
                }

                showSuccess(response.message);
                return response.data ?? null;
            } finally {
                this.loading = false;
            }
        }
    }
});
