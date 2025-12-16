import type { LoginResponse } from '@/types/auth.type';
import { showError } from '@/utils/showNotification.utils';
import axiosInstance from './backendAxiosInstance';

const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await axiosInstance.post('/auth/login', {
            username,
            password
        });
        return response.data;
    } catch (error) {
        showError(error, 'Failed to login. Please check your credentials.');
        throw error;
    }
};

const logout = async (): Promise<void> => {
    try {
        await axiosInstance.post('/auth/logout');
    } catch (error) {
        showError(error, 'Failed to logout.');
        throw error;
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('clientId');
    }
};

export const authService = {
    login,
    logout
};
