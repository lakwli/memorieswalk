import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const authService = {
    login: async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to login' };
        }
    },

    getCurrentUser: async (token) => {
        try {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get user data' };
        }
    }
};

export default authService;
