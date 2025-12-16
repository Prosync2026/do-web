import { animate } from '@motionone/dom';
import axios from 'axios';
import { onMounted, ref } from 'vue';

export const isAuthenticated = ref(false);
export const currentUser = ref<{ username: string; role: string } | null>(null);

export function useLoginCardAnimation() {
    const loginCard = ref<HTMLElement | null>(null);

    onMounted(() => {
        if (loginCard.value) {
            animate(
                loginCard.value,
                {
                    opacity: [0, 1],
                    transform: ['translateY(-40px)', 'translateY(0)']
                },
                {
                    duration: 0.8,
                    easing: 'ease-out'
                }
            );
        }
    });

    return { loginCard };
}

// Load stored user from localStorage
const storedUser = localStorage.getItem('user');
if (storedUser) {
    currentUser.value = JSON.parse(storedUser);
    isAuthenticated.value = true;
}

export async function login(username: string, password: string) {
    try {
        const response = await axios.post('/auth/login', { username, password });

        if (response.data && response.data.token) {
            const userData = { username: response.data.username, role: response.data.role };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', response.data.token);
            currentUser.value = userData;
            isAuthenticated.value = true;
            return { success: true, role: userData.role };
        }
        return { success: false, message: 'Login failed' };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Invalid username or password' };
    }
}

export function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    currentUser.value = null;
    isAuthenticated.value = false;
}
