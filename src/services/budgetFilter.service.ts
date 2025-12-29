import { showError } from '@/utils/showNotification.utils';
import axiosInstance from './backendAxiosInstance';

export const budgetFilterService = {
    async getLocation1(): Promise<string[]> {
        try {
            const res = await axiosInstance.get('/budget/locations/location1');
            return res.data.data || [];
        } catch (error) {
            showError(error, 'Failed to fetch Location1 list.');
            return [];
        }
    },

    async getLocation2(location1: string): Promise<string[]> {
        try {
            const res = await axiosInstance.get('/budget/locations/location2', { params: { location1 } });
            return res.data.data || [];
        } catch (error) {
            showError(error, 'Failed to fetch Location2 list.');
            return [];
        }
    },

    async getElements(): Promise<string[]> {
        try {
            const res = await axiosInstance.get('/budget/elements/elements');
            return res.data.data || [];
        } catch (error) {
            showError(error, 'Failed to fetch Elements list.');
            return [];
        }
    },

    async getSubElements(element: string): Promise<string[]> {
        try {
            const res = await axiosInstance.get('/budget/elements/sub-elements', { params: { element } });
            return res.data.data || [];
        } catch (error) {
            showError(error, 'Failed to fetch SubElements list.');
            return [];
        }
    },

    async getSubSubElements(element: string, subElement: string): Promise<string[]> {
        try {
            const res = await axiosInstance.get('/budget/elements/sub-sub-elements', {
                params: { element, subElement }
            });
            return res.data.data || [];
        } catch (error) {
            showError(error, 'Failed to fetch SubSubElements list.');
            return [];
        }
    }
};
