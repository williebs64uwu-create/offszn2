import { create } from 'zustand';
import apiClient from '../api/client';

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    hasFetchedOnce: false,

    fetchNotifications: async () => {
        set({ loading: true });
        try {
            const { data } = await apiClient.get('/notifications');
            const unreadCount = data.filter(n => !n.read).length;
            set({
                notifications: data,
                unreadCount,
                loading: false,
                hasFetchedOnce: true
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            set({ loading: false });
        }
    },

    markAsRead: async (id) => {
        try {
            await apiClient.put(`/notifications/${id}/read`);
            set((state) => {
                const updated = state.notifications.map(n =>
                    n.id === id ? { ...n, read: true } : n
                );
                return {
                    notifications: updated,
                    unreadCount: updated.filter(n => !n.read).length
                };
            });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await apiClient.put('/notifications/read-all');
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }
}));
