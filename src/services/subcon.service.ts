import { showError } from '@/utils/showNotification.utils';
import axiosInstance from './backendAxiosInstance';

export interface Subcon {
    id: number;
    name: string;
}

export const subconService = {
    async getAll(): Promise<Subcon[]> {
        try {
            const response = await axiosInstance.get('/subcontractors');
            if (response.data.success) {
                return response.data.data.map((s: any) => ({
                    id: s.id,
                    name: s.name
                }));
            } else {
                showError(null, 'Failed to fetch subcontractors');
                return [];
            }
        } catch (error: any) {
            showError(error, 'Failed to fetch subcontractors');
            return [];
        }
    }
};
