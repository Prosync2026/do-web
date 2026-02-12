import { showError } from '@/utils/showNotification.utils';
import axiosInstance from './backendAxiosInstance';

const cleanParams = (params?: Record<string, any>) => {
    return Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        },
        {} as Record<string, any>
    );
};

const getNotifications = async (params?: Record<string, any>) => {
    try {
        const response = await axiosInstance.get('/notifications', {
            params: cleanParams(params)
        });

        return response.data;
    } catch (error) {
        showError(error, 'Failed to fetch notifications.');
        throw error;
    }
};

const getUnreadCount = async () => {
    try {
        const response = await axiosInstance.get('/notifications/unread-count');
        return response.data;
    } catch (error) {
        showError(error, 'Failed to fetch unread notifications.');
        throw error;
    }
};

const markAsRead = async (id: number) => {
    try {
        const response = await axiosInstance.patch(`/notifications/${id}/read`);
        return response.data;
    } catch (error) {
        showError(error, 'Failed to mark notification as read.');
        throw error;
    }
};

const markAllAsRead = async () => {
    try {
        const response = await axiosInstance.post('/notifications/read-all');
        return response.data;
    } catch (error) {
        showError(error, 'Failed to mark all notifications as read.');
        throw error;
    }
};

export const notificationService = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
